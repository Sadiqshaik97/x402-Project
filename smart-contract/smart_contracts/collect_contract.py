"""
F1 Collect - CollectContract
============================================================
Language  : Algorand Python (algopy) v3.x
Network   : Algorand TestNet
Standard  : ARC-4 ABI / ARC-32 compatible
Deployment: AlgoKit → Lora

Features:
  - Admin creates card templates (name, type, rarity, supply, price)
  - Each template auto-creates an ASA (NFT) via inner transaction
  - mint_card: sends 1 NFT unit to recipient (x402 backend calls this)
  - burn_card: marks NFT as burned on-chain
  - list_for_sale: escrow-based secondary market listing
  - cancel_listing: returns escrowed NFT to seller
  - Full read-only methods for card data, burn/listing status

Workflow:
  1. Admin deploys → create_application(minter_address)
  2. Admin calls  → create_card_template(...) → ASA created + stored
  3. User pays via x402 → backend calls → mint_card(card_id, recipient)
  4. NFT appears in user's Pera Wallet
  5. User can list_for_sale(...)  → NFT escrowed in contract
  6. User can burn_card(...)      → NFT burned, status stored on-chain
============================================================
"""

from algopy import (
    ARC4Contract,
    Asset,
    BoxMap,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    itxn,
    gtxn,
    Account,
    Bytes,
    String,
    op,
)


# ─────────────────────────────────────────────
# ARC-4 Structs (on-chain data schemas)
# ─────────────────────────────────────────────

class CardTemplate(arc4.Struct):
    """
    F1 card template — stored in BoxMap keyed by card_id.
    Each template also has a corresponding ASA on Algorand.
    """
    name: arc4.String          # e.g. "Max Verstappen"
    card_type: arc4.String     # Driver | Team | Race Moment | Circuit | RTB
    rarity: arc4.String        # Common | Rare | Epic | Iconic
    description: arc4.String   # Short card description
    max_supply: arc4.UInt64    # Max mintable NFTs for this card
    price: arc4.UInt64         # Price in microALGO
    minted_supply: arc4.UInt64 # How many have been minted
    asset_id: arc4.UInt64      # The ASA ID representing this card NFT
    is_active: arc4.Bool       # Whether minting is enabled


class Listing(arc4.Struct):
    """
    Secondary market listing — stored in BoxMap keyed by listing_id.
    NFT is escrowed in the contract until cancelled or sold.
    """
    seller: arc4.Address       # Seller's Algorand address
    card_id: arc4.UInt64       # Card template this NFT belongs to
    asset_id: arc4.UInt64      # The escrowed ASA
    price: arc4.UInt64         # Asking price in microALGO
    is_active: arc4.Bool       # True=available, False=cancelled


# ─────────────────────────────────────────────
# Main Contract
# ─────────────────────────────────────────────

class CollectContract(ARC4Contract):
    """
    F1 Collect — NFT Card Minting & Marketplace Smart Contract
    ARC-4 ABI compatible, deployable via Lora using ARC-32 JSON spec.
    """

    def __init__(self) -> None:
        # ── Global State ─────────────────────────────────
        self.admin = GlobalState(Account, key=b"admin")
        self.minter = GlobalState(Account, key=b"minter")
        self.total_cards = GlobalState(UInt64, key=b"total_cards")
        self.total_minted = GlobalState(UInt64, key=b"total_minted")
        self.listing_count = GlobalState(UInt64, key=b"listing_count")

        # ── Box Storage ──────────────────────────────────
        self.card_templates = BoxMap(arc4.UInt64, CardTemplate, key_prefix=b"card_")
        self.burned_assets = BoxMap(arc4.UInt64, arc4.Bool, key_prefix=b"burn_")
        self.listings = BoxMap(arc4.UInt64, Listing, key_prefix=b"list_")

    # ─────────────────────────────────────────────────────
    # DEPLOYMENT — Called once when contract is created
    # ─────────────────────────────────────────────────────

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create_application(self, minter: Account) -> None:
        """
        Initialize CollectContract on deployment.
        Sets admin = deployer, minter = x402 backend wallet.
        Resets all counters to 0.

        Args:
            minter: x402 backend server wallet (authorized to call mint_card)
        """
        self.admin.value = Txn.sender
        self.minter.value = minter
        self.total_cards.value = UInt64(0)
        self.total_minted.value = UInt64(0)
        self.listing_count.value = UInt64(0)

    # ─────────────────────────────────────────────────────
    # CREATE CARD TEMPLATE + ASA
    # ─────────────────────────────────────────────────────

    @arc4.abimethod
    def create_card_template(
        self,
        name: arc4.String,
        card_type: arc4.String,
        rarity: arc4.String,
        description: arc4.String,
        max_supply: arc4.UInt64,
        price: arc4.UInt64,
        mbr_payment: gtxn.PaymentTransaction,
    ) -> arc4.UInt64:
        """
        Admin creates an F1 card template and its ASA on-chain.

        Steps:
          1. Validates admin + inputs
          2. Creates ASA via inner transaction (the NFT)
          3. Stores CardTemplate struct in a Box
          4. Returns the new card_id

        Args:
            name         : Card name e.g. "Max Verstappen"
            card_type    : "Driver" / "Team" / "Race Moment" / "Circuit" / "RTB"
            rarity       : "Common" / "Rare" / "Epic" / "Iconic"
            description  : Short description
            max_supply   : Max mintable NFTs for this card type
            price        : Price per card in microALGO
            mbr_payment  : Payment txn for box MBR + ASA creation (min 0.3 ALGO)

        Returns:
            card_id (UInt64)
        """
        assert Txn.sender == self.admin.value, "Only admin can create card templates"
        assert max_supply.native > UInt64(0), "Max supply must be > 0"
        assert price.native > UInt64(0), "Price must be > 0"
        assert mbr_payment.receiver == Global.current_application_address, "MBR must go to contract"
        assert mbr_payment.amount >= UInt64(300_000), "MBR must be at least 0.3 ALGO"

        card_id = self.total_cards.value

        # Create ASA for this card type via inner transaction
        asset_txn = itxn.AssetConfig(
            total=max_supply.native,
            decimals=0,
            default_frozen=False,
            manager=Global.current_application_address,
            reserve=Global.current_application_address,
            freeze=Global.current_application_address,
            clawback=Global.current_application_address,
            asset_name=name.native,
            unit_name="F1NFT",
            url="https://f1collect.app/cards",
            fee=Global.min_txn_fee,
        ).submit()

        # Store template in box
        self.card_templates[arc4.UInt64(card_id)] = CardTemplate(
            name=name,
            card_type=card_type,
            rarity=rarity,
            description=description,
            max_supply=max_supply,
            price=price,
            minted_supply=arc4.UInt64(0),
            asset_id=arc4.UInt64(asset_txn.created_asset.id),
            is_active=arc4.Bool(True),  # noqa: FBT003
        )

        self.total_cards.value = card_id + UInt64(1)
        return arc4.UInt64(card_id)

    # ─────────────────────────────────────────────────────
    # MINTING
    # ─────────────────────────────────────────────────────

    @arc4.abimethod
    def mint_card(
        self,
        card_id: arc4.UInt64,
        recipient: Account,
    ) -> arc4.UInt64:
        """
        Mint 1 NFT from a card template to a recipient.
        Called by the x402 backend after ALGO payment is verified.

        Only admin or authorized minter can call this.

        Args:
            card_id   : ID of the card template to mint from
            recipient : Wallet that receives the NFT (must be opted-in)

        Returns:
            asset_id of the minted NFT
        """
        assert (
            Txn.sender == self.admin.value or Txn.sender == self.minter.value
        ), "Only admin or authorized minter can mint"

        assert card_id in self.card_templates, "Card template not found"

        template = self.card_templates[card_id].copy()
        assert template.is_active.native, "Card template is not active"
        assert template.minted_supply.native < template.max_supply.native, "Max supply reached"

        asset_id = template.asset_id.native

        # Transfer 1 unit via clawback (contract has clawback authority)
        itxn.AssetTransfer(
            xfer_asset=Asset(asset_id),
            asset_amount=UInt64(1),
            asset_sender=Global.current_application_address,
            asset_receiver=recipient,
            fee=Global.min_txn_fee,
        ).submit()

        # Update minted_supply in box
        self.card_templates[card_id] = CardTemplate(
            name=template.name,
            card_type=template.card_type,
            rarity=template.rarity,
            description=template.description,
            max_supply=template.max_supply,
            price=template.price,
            minted_supply=arc4.UInt64(template.minted_supply.native + UInt64(1)),
            asset_id=template.asset_id,
            is_active=template.is_active,
        )

        self.total_minted.value = self.total_minted.value + UInt64(1)
        return arc4.UInt64(asset_id)

    # ─────────────────────────────────────────────────────
    # BURN
    # ─────────────────────────────────────────────────────

    @arc4.abimethod
    def burn_card(
        self,
        asset_id: arc4.UInt64,
        burn_txn: gtxn.AssetTransferTransaction,
    ) -> None:
        """
        Burn an NFT permanently on-chain.
        User must send the NFT to the contract in the same atomic group.

        Args:
            asset_id : ASA ID of the NFT to burn
            burn_txn : Grouped AssetTransfer — 1 unit to contract address
        """
        assert burn_txn.asset_receiver == Global.current_application_address, "NFT must be sent to contract to burn"
        assert burn_txn.asset_amount == UInt64(1), "Must burn exactly 1 NFT"
        assert burn_txn.xfer_asset.id == asset_id.native, "Asset ID mismatch"

        # Record burn status on-chain
        self.burned_assets[asset_id] = arc4.Bool(True)  # noqa: FBT003

    # ─────────────────────────────────────────────────────
    # SECONDARY MARKET — LISTING
    # ─────────────────────────────────────────────────────

    @arc4.abimethod
    def list_for_sale(
        self,
        asset_id: arc4.UInt64,
        card_id: arc4.UInt64,
        sale_price: arc4.UInt64,
        deposit_txn: gtxn.AssetTransferTransaction,
    ) -> arc4.UInt64:
        """
        List an NFT on the secondary market (escrow-based).
        User must send the NFT to the contract in the same atomic group.

        Args:
            asset_id    : ASA ID of the NFT
            card_id     : Card template ID this NFT belongs to
            sale_price  : Asking price in microALGO
            deposit_txn : Grouped AssetTransfer escrowing NFT to contract

        Returns:
            listing_id
        """
        assert deposit_txn.asset_receiver == Global.current_application_address, "NFT must be escrowed to contract"
        assert deposit_txn.asset_amount == UInt64(1), "Must deposit exactly 1 NFT"
        assert deposit_txn.xfer_asset.id == asset_id.native, "Asset ID mismatch"
        assert sale_price.native > UInt64(0), "Sale price must be > 0"

        listing_id = self.listing_count.value

        self.listings[arc4.UInt64(listing_id)] = Listing(
            seller=arc4.Address(Txn.sender),
            card_id=card_id,
            asset_id=asset_id,
            price=sale_price,
            is_active=arc4.Bool(True),  # noqa: FBT003
        )

        self.listing_count.value = listing_id + UInt64(1)
        return arc4.UInt64(listing_id)

    @arc4.abimethod
    def cancel_listing(self, listing_id: arc4.UInt64) -> None:
        """
        Cancel a secondary market listing and return NFT to seller.
        Only the original seller or admin can cancel.

        Args:
            listing_id : ID of the listing to cancel
        """
        assert listing_id in self.listings, "Listing not found"
        listing = self.listings[listing_id].copy()
        assert listing.is_active.native, "Listing is already inactive"
        assert (
            listing.seller.native == Txn.sender or Txn.sender == self.admin.value
        ), "Only seller or admin can cancel"

        # Return NFT to seller
        itxn.AssetTransfer(
            xfer_asset=Asset(listing.asset_id.native),
            asset_amount=UInt64(1),
            asset_receiver=listing.seller.native,
            fee=Global.min_txn_fee,
        ).submit()

        # Deactivate listing
        self.listings[listing_id] = Listing(
            seller=listing.seller,
            card_id=listing.card_id,
            asset_id=listing.asset_id,
            price=listing.price,
            is_active=arc4.Bool(False),  # noqa: FBT003
        )

    # ─────────────────────────────────────────────────────
    # ADMIN UTILITIES
    # ─────────────────────────────────────────────────────

    @arc4.abimethod
    def set_minter(self, new_minter: Account) -> None:
        """Admin updates the authorized minter address."""
        assert Txn.sender == self.admin.value, "Only admin can update minter"
        self.minter.value = new_minter

    @arc4.abimethod
    def deactivate_card(self, card_id: arc4.UInt64) -> None:
        """Admin disables minting for a card template (e.g. sold out)."""
        assert Txn.sender == self.admin.value, "Only admin"
        assert card_id in self.card_templates, "Card not found"
        template = self.card_templates[card_id].copy()
        self.card_templates[card_id] = CardTemplate(
            name=template.name,
            card_type=template.card_type,
            rarity=template.rarity,
            description=template.description,
            max_supply=template.max_supply,
            price=template.price,
            minted_supply=template.minted_supply,
            asset_id=template.asset_id,
            is_active=arc4.Bool(False),  # noqa: FBT003
        )

    # ─────────────────────────────────────────────────────
    # READ-ONLY METHODS
    # ─────────────────────────────────────────────────────

    @arc4.abimethod(readonly=True)
    def get_card_template(self, card_id: arc4.UInt64) -> CardTemplate:
        """Get full details of a card template by ID."""
        assert card_id in self.card_templates, "Card template not found"
        return self.card_templates[card_id]

    @arc4.abimethod(readonly=True)
    def get_total_cards(self) -> arc4.UInt64:
        """Get total number of card templates created."""
        return arc4.UInt64(self.total_cards.value)

    @arc4.abimethod(readonly=True)
    def get_total_minted(self) -> arc4.UInt64:
        """Get total NFTs minted across all card types."""
        return arc4.UInt64(self.total_minted.value)

    @arc4.abimethod(readonly=True)
    def is_burned(self, asset_id: arc4.UInt64) -> arc4.Bool:
        """Check if an NFT has been burned."""
        if asset_id in self.burned_assets:
            return self.burned_assets[asset_id]
        return arc4.Bool(False)  # noqa: FBT003

    @arc4.abimethod(readonly=True)
    def get_listing(self, listing_id: arc4.UInt64) -> Listing:
        """Get secondary market listing details."""
        assert listing_id in self.listings, "Listing not found"
        return self.listings[listing_id]

    @arc4.abimethod(readonly=True)
    def get_total_listings(self) -> arc4.UInt64:
        """Get total number of listings ever created."""
        return arc4.UInt64(self.listing_count.value)

    @arc4.abimethod(readonly=True)
    def get_admin(self) -> arc4.Address:
        """Get the admin wallet address."""
        return arc4.Address(self.admin.value)

    @arc4.abimethod(readonly=True)
    def get_minter(self) -> arc4.Address:
        """Get the authorized minter wallet address."""
        return arc4.Address(self.minter.value)

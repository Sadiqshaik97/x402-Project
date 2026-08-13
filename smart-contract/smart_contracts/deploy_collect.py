"""
CollectContract Deployment Script (v2)
=======================================
Deploys F1 Collect CollectContract to Algorand TestNet.

Usage:
    python smart_contracts/deploy_collect.py

The script reuses deployer_key.json if it exists.
Fund the address shown at: https://bank.testnet.algorand.network/
"""

import json
import os
import sys
import time
import base64
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod

# ── Config ──────────────────────────────────────────────────
ALGOD_URL  = "https://testnet-api.algonode.cloud"
ALGOD_TOKEN = ""
ARTIFACTS  = os.path.join(os.path.dirname(__file__), "..", "artifacts")
KEY_FILE   = os.path.join(os.path.dirname(__file__), "..", "deployer_key.json")

def get_client():
    return algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

def load_or_create_account():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE) as f:
            data = json.load(f)
        pk   = mnemonic.to_private_key(data["mnemonic"])
        addr = account.address_from_private_key(pk)
        print("[KEY] Loaded deployer: " + addr)
    else:
        pk   = account.generate_account()[0]
        addr = account.address_from_private_key(pk)
        mn   = mnemonic.from_private_key(pk)
        with open(KEY_FILE, "w") as f:
            json.dump({"address": addr, "mnemonic": mn}, f, indent=2)
        print("[KEY] New deployer: " + addr)
    return pk, addr

def compile_teal(client, teal_source):
    result = client.compile(teal_source)
    return base64.b64decode(result["result"])

def load_teal():
    approval_path = os.path.join(ARTIFACTS, "CollectContract.approval.teal")
    clear_path    = os.path.join(ARTIFACTS, "CollectContract.clear.teal")
    with open(approval_path) as f:
        approval = f.read()
    with open(clear_path) as f:
        clear = f.read()
    print("[OK] TEAL files loaded from artifacts/")
    return approval, clear

def deploy():
    print("\n" + "=" * 60)
    print("  F1 Collect - CollectContract Deployment (TestNet)")
    print("=" * 60 + "\n")

    client   = get_client()
    pk, addr = load_or_create_account()

    # ── Check balance ──────────────────────────────────
    try:
        info    = client.account_info(addr)
        balance = info.get("amount", 0)
    except Exception:
        balance = 0
    print("[BALANCE] " + str(balance / 1e6) + " ALGO")

    # ── Poll until funded (user funds manually) ────────
    if balance < 300_000:
        print("\n" + "=" * 60)
        print("  ACTION REQUIRED: FUND THIS ADDRESS")
        print("=" * 60)
        print("  Address : " + addr)
        print("  Fund at : https://bank.testnet.algorand.network/")
        print("=" * 60)
        print("\n[WAIT] Checking balance every 5 seconds (up to 3 min)...\n")
        for i in range(36):
            time.sleep(5)
            try:
                info    = client.account_info(addr)
                balance = info.get("amount", 0)
            except Exception:
                balance = 0
            status = "[" + str(i+1) + "/36]"
            print(status + " Balance: " + str(balance / 1e6) + " ALGO")
            if balance >= 1_000_000:
                print("[OK] Funded! Proceeding with deployment...\n")
                break
        else:
            print("\n[ERROR] Timed out waiting for funds. Run script again after funding.")
            sys.exit(1)

    # ── Load + compile TEAL ────────────────────────────
    approval_teal, clear_teal = load_teal()
    approval_bytes = compile_teal(client, approval_teal)
    clear_bytes    = compile_teal(client, clear_teal)
    print("[OK] TEAL compiled via algod")

    # ── Build create txn ──────────────────────────────
    params = client.suggested_params()
    # GlobalState: 3 uints (total_cards, total_minted, listing_count)
    #              2 byte slices (admin, minter)
    global_schema = transaction.StateSchema(num_uints=3, num_byte_slices=2)
    local_schema  = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # Compute ABI method selector: first 4 bytes of SHA512/256("create_application(account)void")
    import hashlib
    method_signature = "create_application(account)void"
    h = hashlib.new("sha512_256")
    h.update(method_signature.encode("utf-8"))
    method_selector = h.digest()[:4]
    print("[ABI] Method selector: " + method_selector.hex())

    txn = transaction.ApplicationCreateTxn(
        sender=addr,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_bytes,
        clear_program=clear_bytes,
        global_schema=global_schema,
        local_schema=local_schema,
        accounts=[addr],     # minter = admin (index 1 in foreign accounts array)
        app_args=[
            method_selector,
            b'\x01',         # ARC-4 account type = uint8 index into accounts array
        ],
        note=b"F1Collect-CollectContract-v1",
    )

    signed = txn.sign(pk)
    tx_id  = client.send_transaction(signed)
    print("[TXN] Broadcasted: " + tx_id)

    # ── Wait for confirmation ──────────────────────────
    print("[WAIT] Confirming on Algorand TestNet...")
    confirmed = transaction.wait_for_confirmation(client, tx_id, 5)
    app_id    = confirmed["application-index"]

    try:
        from algosdk import logic
        app_address = logic.get_application_address(app_id)
    except Exception:
        app_address = "(see Lora)"

    # ── Save deployment info ───────────────────────────
    info_out = {
        "app_id":      app_id,
        "app_address": app_address,
        "deployer":    addr,
        "tx_id":       tx_id,
        "lora_url":    "https://testnet.lora.algokit.io/application/" + str(app_id),
    }
    out_path = os.path.join(ARTIFACTS, "deployment_info.json")
    with open(out_path, "w") as f:
        json.dump(info_out, f, indent=2)

    print("\n" + "=" * 60)
    print("  CollectContract DEPLOYED SUCCESSFULLY!")
    print("=" * 60)
    print("  App ID       : " + str(app_id))
    print("  App Address  : " + app_address)
    print("  Deployer     : " + addr)
    print("  TX ID        : " + tx_id)
    print("  Lora URL     : https://testnet.lora.algokit.io/application/" + str(app_id))
    print("=" * 60 + "\n")

if __name__ == "__main__":
    deploy()

import type { Context } from 'hono';
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';

export interface F1Card {
  id: string;
  driver: string;
  team: string;
  number: number;
  rarity: 'Common' | 'Rare' | 'Legendary';
  topSpeed: number; // km/h
  acceleration: number; // 0-100 km/h in sec
  corneringG: number; // G-force
  championships: number;
  imageUrl: string;
  mintedAt: string;
  packType: 'Basic' | 'Apex';
  owner?: string;
  assetId?: number;
  txId?: string;
  loraUrl?: string;
}

const CARDS_FILE_PATH = path.join(process.cwd(), 'user-cards.json');

function loadPersistedCards(): F1Card[] {
  try {
    if (fs.existsSync(CARDS_FILE_PATH)) {
      const data = fs.readFileSync(CARDS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load user-cards.json:', err);
  }
  return [];
}

function savePersistedCards(cards: F1Card[]) {
  try {
    fs.writeFileSync(CARDS_FILE_PATH, JSON.stringify(cards, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save user-cards.json:', err);
  }
}

// In-memory store initialized from persistent file
const userCardsStore: F1Card[] = loadPersistedCards();

const DRIVERS_DB: Omit<F1Card, 'id' | 'mintedAt' | 'packType'>[] = [
  {
    driver: 'Max Verstappen',
    team: 'Red Bull Racing',
    number: 1,
    rarity: 'Legendary',
    topSpeed: 355,
    acceleration: 2.1,
    corneringG: 5.2,
    championships: 3,
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
  },
  {
    driver: 'Lewis Hamilton',
    team: 'Ferrari',
    number: 44,
    rarity: 'Legendary',
    topSpeed: 352,
    acceleration: 2.2,
    corneringG: 5.1,
    championships: 7,
    imageUrl: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?auto=format&fit=crop&w=600&q=80',
  },
  {
    driver: 'Charles Leclerc',
    team: 'Ferrari',
    number: 16,
    rarity: 'Legendary',
    topSpeed: 353,
    acceleration: 2.15,
    corneringG: 5.0,
    championships: 0,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
  },
  {
    driver: 'Lando Norris',
    team: 'McLaren',
    number: 4,
    rarity: 'Rare',
    topSpeed: 350,
    acceleration: 2.25,
    corneringG: 4.9,
    championships: 0,
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
  },
  {
    driver: 'Fernando Alonso',
    team: 'Aston Martin',
    number: 14,
    rarity: 'Rare',
    topSpeed: 349,
    acceleration: 2.3,
    corneringG: 4.85,
    championships: 2,
    imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80',
  },
  {
    driver: 'Pierre Gasly',
    team: 'Alpine',
    number: 10,
    rarity: 'Common',
    topSpeed: 345,
    acceleration: 2.4,
    corneringG: 4.7,
    championships: 0,
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
  },
];

// In-memory store initialized from persistent file
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

async function mintNFTOnChain(driverName: string, recipientAddress?: string): Promise<{ assetId?: number; txId?: string; loraUrl?: string }> {
  try {
    const mnemonicStr = process.env.MINTER_MNEMONIC;
    if (!mnemonicStr) {
      console.warn('⚠️ MINTER_MNEMONIC not set in .env. Skipping on-chain ASA creation.');
      return {};
    }

    const minterAccount = algosdk.mnemonicToSecretKey(mnemonicStr);
    const params = await algodClient.getTransactionParams().do();

    // Create ASA representing the text-based F1 NFT Card
    const note = new TextEncoder().encode(`F1 Collect NFT: ${driverName} - Minted via x402 Protocol`);
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: minterAccount.addr,
      note,
      total: 1,
      decimals: 0,
      defaultFrozen: false,
      manager: minterAccount.addr,
      reserve: minterAccount.addr,
      freeze: minterAccount.addr,
      clawback: minterAccount.addr,
      assetName: driverName.slice(0, 32),
      unitName: 'F1NFT',
      assetURL: 'https://f1collect.app/cards',
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(minterAccount.sk);
    const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log(`📡 Broadcasted ASA Creation TxID: ${txid}`);

    const ptx = await algosdk.waitForConfirmation(algodClient, txid, 4);
    const assetId = ptx.assetIndex !== undefined ? Number(ptx.assetIndex) : undefined;

    console.log(`✅ On-Chain F1 NFT ASA Created! Asset ID: ${assetId}, TxID: ${txid}`);

    return {
      assetId,
      txId: txid,
      loraUrl: `https://testnet.lora.algokit.io/transaction/${txid}`,
    };
  } catch (error) {
    console.error('Failed to mint ASA on-chain:', error);
    return {};
  }
}

export async function handleBuyBasicPack(c: Context) {
  try {
    const userAddress = c.req.header('x-user-address') || c.req.query('address') || 'ANONYMOUS';
    console.log(`🏎️ [x402] PAYMENT VERIFIED - Opening Basic Pack (1 ALGO) for user: ${userAddress}`);

    // Select Common / Rare driver
    const pool = DRIVERS_DB.filter((d) => d.rarity === 'Common' || d.rarity === 'Rare');
    const selected = pool[Math.floor(Math.random() * pool.length)];

    // Mint on-chain ASA
    const onChainResult = await mintNFTOnChain(selected.driver, userAddress);

    const mintedCard: F1Card = {
      ...selected,
      id: `F1-BASIC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mintedAt: new Date().toISOString(),
      packType: 'Basic',
      owner: userAddress,
      assetId: onChainResult.assetId,
      txId: onChainResult.txId,
      loraUrl: onChainResult.loraUrl,
    };

    userCardsStore.push(mintedCard);
    savePersistedCards(userCardsStore);

    return c.json({
      success: true,
      message: 'Basic Pack opened successfully! F1 NFT Card minted on-chain.',
      card: mintedCard,
      transactionTime: new Date().toISOString(),
      paidVia: 'x402 Protocol on Algorand TestNet (1 ALGO)',
    });
  } catch (error) {
    console.error('Error opening Basic Pack:', error);
    return c.json({ error: 'Failed to mint Basic Pack card' }, 500);
  }
}

export async function handleBuyPremiumPack(c: Context) {
  try {
    const userAddress = c.req.header('x-user-address') || c.req.query('address') || 'ANONYMOUS';
    console.log(`🏁 [x402] PAYMENT VERIFIED - Opening Apex Pack (5 ALGO) for user: ${userAddress}`);

    // Select Rare / Legendary driver
    const pool = DRIVERS_DB.filter((d) => d.rarity === 'Rare' || d.rarity === 'Legendary');
    const selected = pool[Math.floor(Math.random() * pool.length)];

    // Mint on-chain ASA
    const onChainResult = await mintNFTOnChain(selected.driver, userAddress);

    const mintedCard: F1Card = {
      ...selected,
      id: `F1-APEX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mintedAt: new Date().toISOString(),
      packType: 'Apex',
      owner: userAddress,
      assetId: onChainResult.assetId,
      txId: onChainResult.txId,
      loraUrl: onChainResult.loraUrl,
    };

    userCardsStore.push(mintedCard);
    savePersistedCards(userCardsStore);

    return c.json({
      success: true,
      message: 'Apex Pack opened successfully! Premium F1 NFT Card minted on-chain.',
      card: mintedCard,
      transactionTime: new Date().toISOString(),
      paidVia: 'x402 Protocol on Algorand TestNet (5 ALGO)',
    });
  } catch (error) {
    console.error('Error opening Apex Pack:', error);
    return c.json({ error: 'Failed to mint Apex Pack card' }, 500);
  }
}

export async function handleGetMyCards(c: Context) {
  const userAddress = c.req.query('address') || c.req.header('x-user-address');
  
  const currentCards = loadPersistedCards();
  let cards = currentCards;
  if (userAddress && userAddress !== 'ANONYMOUS') {
    cards = currentCards.filter(card => !card.owner || card.owner === userAddress || card.owner === 'ANONYMOUS');
  }

  return c.json({
    totalCards: cards.length,
    cards: cards,
  });
}

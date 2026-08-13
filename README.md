# 🏎️ F1 Collect - x402 Micropayments DApp

An end-to-end Formula 1 NFT card collection web application built with the **x402 HTTP Payment Protocol** on **Algorand TestNet**.

Users can connect their Algorand wallets (Pera Wallet, Defly, etc.), purchase **Basic Packs (1.0 ALGO)** and **Apex Packs (5.0 ALGO)** via instant on-chain x402 micro-settlements, and build their F1 Driver Garage.

---

## 📂 Architecture

```text
x402-Project/
├── f1-collect-backend/        ⚡ Node.js + Hono + TypeScript Payment API Server
│   ├── handlers/
│   │   ├── f1collect.ts      🏎️ F1 Basic Pack & Apex Pack minting handlers
│   │   ├── weather.ts
│   │   └── meme-generator.ts
│   ├── endpoints.config.ts   📝 x402 route & pricing configuration
│   └── index.ts              🚀 Main Hono server entry point
│
├── f1-collect-frontend/       🎨 React + Vite + TypeScript + TailwindCSS Web App
│   ├── src/
│   │   ├── F1CollectHome.tsx 🏎️ F1 Collect Pack Store, Garage & Marketplace
│   │   ├── components/       🔌 ConnectWallet, Transact, etc.
│   │   ├── App.tsx           ⚡ Tab Navigator & Wallet Provider
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── smart-contract/           📜 Algorand PyTeal Smart Contract
│   ├── smart_contracts/
│   │   └── collect_contract.py 🏎️ Card minting contract
│   └── pyproject.toml
│
└── README.md                 📖 Project Documentation
```

---

## ⚡ How to Run

### 1. Backend Server (`/f1-collect-backend`)
```bash
cd f1-collect-backend
npm install
npm start
```
*Runs at `http://localhost:4021`.*

### 2. Frontend Web App (`/f1-collect-frontend`)
```bash
cd f1-collect-frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🏎️ F1 Collect Features

1. **Pack Store**:
   - **Sprint Pack (1.0 ALGO)**: Common & Rare driver cards (Gasly, Alonso, Norris).
   - **Apex Pack (5.0 ALGO)**: Rare & Legendary driver cards (Verstappen, Hamilton, Leclerc).
2. **x402 Protocol Micropayments**:
   - Seamless HTTP 402 Payment Required flow on Algorand TestNet.
3. **F1 Garage / My Collection**:
   - Rarity badges (Common, Rare, Legendary), top speed, 0-100 acceleration, and championship stats.
4. **Secondary Marketplace**:
   - Peer-to-peer card trading hub.

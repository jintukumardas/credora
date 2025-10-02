# Credora

Domain-collateralized DeFi platform built on Doma Protocol. Turn your domains into productive assets through lending, leasing, and automated revenue distribution.

## Features

- **Domain Lending** - Borrow stablecoins using tokenized domains as collateral
- **Rights Leasing** - Lease granular domain permissions (DNS, nameservers, parking) to generate income
- **Automated Yield** - On-chain revenue distribution from domain activities to multiple beneficiaries
- **Multi-Chain Support** - Works across Ethereum, Base, and Doma chains
- **Doma Protocol Integration** - Full integration with domain tokenization and synthetic token creation

## Architecture

### Smart Contracts

- `DomainLending.sol` - NFT-collateralized lending protocol for domain tokens
- `DomainLeasing.sol` - Marketplace for leasing domain permissions via synthetic tokens
- `RevenueDistributor.sol` - Automated revenue sharing and yield distribution
- `MockERC20.sol` - Test token for development

### Frontend

- Next.js 15 with TypeScript
- RainbowKit for wallet connection
- Wagmi for Ethereum interactions
- Framer Motion for animations
- GraphQL client for Doma Subgraph queries

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Installation

```bash
npm install
```

### Configuration

1. Copy the environment file:
```bash
cp .env.example .env
```

2. Add your configuration to `.env`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_DOMA_SUBGRAPH_URL=https://api-testnet.doma.xyz/graphql
NEXT_PUBLIC_DOMA_RPC_URL=https://rpc-testnet.doma.xyz
```

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Smart Contract Deployment

1. Configure your deployment network in `hardhat.config.ts`

2. Add your private key to `.env`:
```
PRIVATE_KEY=your_private_key_here
```

3. Deploy contracts to Doma Testnet:
```bash
npx hardhat run scripts/deploy.ts --network domaTestnet
```

4. Update the contract addresses in `.env` with the deployed addresses

### Testing Smart Contracts

Run the test suite:
```bash
npx hardhat test
```

## Project Structure

```
credora/
├── app/                    # Next.js app directory
│   ├── dashboard/         # User domain dashboard
│   ├── lending/           # Lending marketplace
│   ├── leasing/           # Rights leasing interface
│   └── revenue/           # Revenue distribution
├── components/            # React components
├── contracts/             # Solidity smart contracts
├── lib/                   # Utility libraries
│   ├── doma-client.ts    # Doma Protocol integration
│   ├── wagmi-config.ts   # Web3 configuration
│   └── contract-addresses.ts
├── scripts/               # Deployment scripts
└── public/                # Static assets
```

## How It Works

### 1. Domain Tokenization
Users tokenize their domains through Doma Protocol, creating an NFT that represents domain ownership while maintaining DNS compliance.

### 2. Borrowing
Domain owners can use their tokenized domains as collateral to borrow stablecoins at up to 80% loan-to-value ratio with competitive interest rates.

### 3. Leasing Rights
Using Doma's synthetic tokens, domain owners split specific permissions (DNS control, nameservers, etc.) and lease them to generate passive income.

### 4. Revenue Distribution
Automated on-chain distribution of domain-generated revenue (parking, ads, leases) to multiple beneficiaries according to predefined shares.

## Security

All smart contracts use OpenZeppelin libraries and implement standard security practices including reentrancy guards, access control, and safe token transfers. For production use, contracts should be audited by professional security firms.

## Built With

- [Doma Protocol](https://docs.doma.xyz) - Domain tokenization and synthetic tokens
- [Next.js](https://nextjs.org) - React framework
- [Hardhat](https://hardhat.org) - Ethereum development environment
- [Wagmi](https://wagmi.sh) - React hooks for Ethereum
- [RainbowKit](https://www.rainbowkit.com) - Wallet connection UI
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Tailwind CSS](https://tailwindcss.com) - Styling

## License

MIT

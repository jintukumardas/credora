# Credora -  Domain-Collateralized DeFi Platform

Domain-collateralized DeFi platform that enables domain owners to unlock liquidity from their tokenized domains through lending, leasing, fractionalization, and marketplace features powered by Doma Protocol.

## Key Features

### 1. **AI-Powered Domain Marketplace**
- Real-time trending domains powered by Google Generative AI
- Create listings and offers using Doma Orderbook SDK
- Buy/sell domains with on-chain settlement
- Advanced filtering and search capabilities
- Real-time price updates and market insights

### 2. **Domain-Backed Lending**
- Use tokenized domains as collateral for loans
- Smart contract-based lending with automated liquidation
- Real-time loan tracking and management
- Support for multiple stablecoins (USDC, USDT)

### 3. **Domain Fractionalization**
- Split domain ownership into fungible tokens
- Enable fractional ownership and trading
- Buyout mechanism for full ownership recovery
- Integration with Doma Fractionalization contracts

### 4. **XMTP Messaging Hub**
- End-to-end encrypted messaging between domain owners
- Domain-verified messaging for trusted communication
- Negotiation channels for domain transactions
- Support tickets and dispute resolution

### 5. **Real-Time State Management**
- Global state management with Zustand
- Persistent user preferences
- Real-time transaction monitoring
- Push notifications for important events

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit
- **State Management**: Zustand with persistence
- **Messaging**: XMTP Protocol
- **AI**: Google Generative AI (Gemini)
- **Blockchain**: Doma Protocol on Doma Testnet

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/credora.git
cd credora
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Required: Get from https://ai.google.dev
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key

# Required: Get from https://walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional: Deploy your own contracts
NEXT_PUBLIC_LENDING_CONTRACT=0x...
NEXT_PUBLIC_LEASING_CONTRACT=0x...
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🌟 Features in Detail

### Dashboard
- View portfolio overview with real-time valuation
- Track active loans and leases
- AI-powered trending domains with market sentiment
- Market insights and hot categories
- Quick actions for lending, leasing, and marketplace

### Marketplace
- **Buy Domains**: Browse and purchase listed domains
- **Sell Domains**: Create listings for your domains
- **Make Offers**: Submit offers on unlisted domains
- **Orderbook Integration**: Real-time bid/ask orderbook
- **AI Analysis**: Domain valuation and trending scores

### Lending Platform
- **Create Loans**: Use domains as collateral
- **Smart Contracts**: Automated loan management
- **Interest Calculation**: Real-time interest accrual
- **Loan Management**: Track and repay loans

### Fractionalization
- **Split Ownership**: Create fractional tokens
- **Set Buyout Price**: Define minimum buyout value
- **Trade Fractions**: Buy/sell fractional ownership
- **Complete Buyout**: Reclaim full ownership

### Messaging Hub
- **Encrypted Chat**: XMTP-powered messaging
- **Domain Verification**: Verified sender domains
- **Negotiation Channels**: Structured deal discussions
- **Conversation Management**: Archive and search messages

## 🔧 Smart Contract Integration

The platform integrates with multiple smart contracts:

### Doma Protocol Contracts (Mainnet)
- **Ownership Token**: NFT representing domain ownership
- **Record Contract**: Domain records and metadata
- **Gateway**: Cross-chain domain management
- **Fractionalization**: Domain splitting functionality

### Credora Contracts (Deploy Your Own)
- **DomainLending.sol**: Collateralized lending
- **DomainLeasing.sol**: Rental and leasing
- **RevenueDistributor.sol**: Revenue sharing
- **SyntheticTokenFactory.sol**: Synthetic domain tokens

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ and npm
- Google AI API key
- WalletConnect Project ID
- Access to Doma Testnet

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel deploy --prod
```

## 📊 API Integration

### Google AI Integration
The platform uses Google's Gemini AI for:
- Trending domain analysis
- Market sentiment prediction
- Domain valuation estimates
- Investment recommendations

### Doma API Integration
- GraphQL API for domain queries
- WebSocket for real-time updates
- Orderbook API for trading
- Subgraph for historical data

## 🔒 Security Features

- **Smart Contract Audits**: All contracts audited
- **Input Validation**: Comprehensive validation
- **Rate Limiting**: API request throttling
- **Secure Storage**: Encrypted local storage
- **CORS Protection**: Proper origin validation

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📈 Performance Optimizations

- **Code Splitting**: Dynamic imports for routes
- **Image Optimization**: Next.js Image component
- **State Persistence**: Zustand with localStorage
- **Caching**: 5-minute cache for trending data
- **Lazy Loading**: Components loaded on demand

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Doma Protocol](https://doma.xyz) for domain tokenization infrastructure
- [Google AI](https://ai.google.dev) for AI-powered features
- [XMTP](https://xmtp.org) for encrypted messaging
- [WalletConnect](https://walletconnect.com) for wallet connectivity

## 📞 Support

For support, please:
1. Check the [documentation](https://docs.doma.xyz)
2. Open an issue on GitHub
3. Contact support through the in-app messaging

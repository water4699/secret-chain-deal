# Secret Chain Deal

A decentralized encrypted multi-party negotiation platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. Submit and manage encrypted deal offers on-chain where your offers remain completely private until all parties reveal.

## 🎬 Demo

<video src="./demo.mp4" controls width="100%"></video>

## 🌐 Live Demo

Try it now: **[https://secret-chain-deal.vercel.app/](https://secret-chain-deal.vercel.app/)**

## ✨ Features

- **🔐 Encrypted Offers** - All offer values are encrypted on-chain using FHE, ensuring complete privacy
- **🛡️ Private Processing** - Compute on encrypted data without ever decrypting it
- **👥 Multi-Party Deals** - Fair negotiation with multiple parties where no one can see others' offers
- **🔓 Simultaneous Reveal** - All offers decrypt simultaneously when everyone finalizes
- **📊 Real-time Validation** - Frontend validation with instant feedback
- **🌙 Modern UI** - Beautiful dark theme with smooth animations

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity** ^0.8.24
- **Hardhat** 2.21.0
- **FHEVM** (@fhevm/solidity ^0.9.1)
- **Zama FHE Oracle** (@zama-fhe/oracle-solidity ^0.1.0)
- **ethers.js** ^6.15.0

### Frontend
- **Next.js** ^15.4.2
- **React** ^19.1.0
- **TypeScript** ^5
- **Tailwind CSS** ^3.4.1
- **RainbowKit** ^2.2.5
- **wagmi** ^2.14.11
- **viem** ^2.21.54

## 📁 Project Structure

```
secret-chain-deal/
├── contracts/               # Solidity smart contracts
│   ├── FHECounter.sol       # FHE counter example contract
│   └── SecretDeal.sol       # Main encrypted deal negotiation contract
├── deploy/                  # Deployment scripts
│   └── deploy.ts            # Contract deployment with verification
├── tasks/                   # Hardhat custom tasks
│   ├── accounts.ts          # Account management tasks
│   └── FHECounter.ts        # FHECounter interaction tasks
├── test/                    # Test files
│   ├── FHECounter.ts        # FHECounter unit tests
│   ├── FHECounterSepolia.ts # Sepolia testnet tests
│   ├── SecretDeal.ts        # SecretDeal unit tests
│   └── SecretDealSepolia.ts # Sepolia testnet tests
├── frontend/                # Next.js frontend application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── fhevm/               # FHEVM integration utilities
│   └── lib/                 # Utility functions
├── hardhat.config.ts        # Hardhat configuration
└── package.json             # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VictorRaman77/secret-chain-deal.git
   cd secret-chain-deal
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   pnpm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # For Sepolia deployment (optional)
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

### Running Locally

1. **Start local Hardhat node**
   ```bash
   npm run node
   ```

2. **Deploy contracts (in a new terminal)**
   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start the frontend**
   ```bash
   cd frontend
   pnpm dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Deploy to Sepolia Testnet

```bash
# Deploy contracts
npx hardhat deploy --network sepolia

# Run tests on Sepolia
npx hardhat test --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📜 Smart Contracts

### SecretDeal.sol

The main contract for encrypted multi-party negotiations:

- **createDeal()** - Create a new deal with name and required parties
- **submitOffer()** - Submit an encrypted offer with title and description
- **revealOffer()** - Reveal your encrypted offer
- **finalizeDeal()** - Finalize the deal after all offers are revealed
- **cancelDeal()** - Cancel a deal (creator only)
- **getDealsByParty()** - Query all deals a party has participated in

**Security Features:**
- Maximum deal name length: 256 characters
- Maximum parties per deal: 100
- Only creator can cancel deals
- Creator tracking for all deals

### FHECounter.sol

A simple FHE counter contract for demonstration:

- **increment()** - Increment counter with encrypted value
- **decrement()** - Decrement counter with encrypted value
- **getCount()** - Get encrypted count handle

**Events:**
- `CountIncremented` - Emitted on increment
- `CountDecremented` - Emitted on decrement

## 📜 Available Scripts

### Backend (Root Directory)

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run all tests locally |
| `npm run test:sepolia` | Run tests on Sepolia |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run linting checks |
| `npm run clean` | Clean build artifacts |
| `npm run node` | Start local Hardhat node |

### Frontend (frontend/ Directory)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

### Hardhat Tasks

```bash
# List accounts with balances
npx hardhat accounts --network localhost

# Check specific account balance
npx hardhat account:balance --address <ADDRESS> --network localhost

# Get FHECounter address
npx hardhat task:address --network localhost

# Decrypt current count
npx hardhat task:decrypt-count --network localhost

# Increment counter
npx hardhat task:increment --value 5 --network localhost

# Decrement counter
npx hardhat task:decrement --value 3 --network localhost

# Batch increment
npx hardhat task:batch-increment --values "1,2,3,4,5" --network localhost
```

## 🧪 Testing

```bash
# Run local tests (mock environment)
npm run test

# Run specific test file
npx hardhat test test/SecretDeal.ts

# Run Sepolia tests (requires deployment)
npm run test:sepolia

# Generate coverage report
npm run coverage
```

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [RainbowKit Documentation](https://rainbowkit.com/docs)
- [wagmi Documentation](https://wagmi.sh)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/VictorRaman77/secret-chain-deal/issues)
- **FHEVM Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **Zama Discord**: [Join Community](https://discord.gg/zama)

---

**Built with ❤️ using Zama's FHEVM technology**

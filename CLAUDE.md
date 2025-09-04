# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Setup and Installation
```bash
npm run setup          # Install dependencies and setup husky hooks
npm run setup:full     # Complete clean setup with cache cleaning
npm run setup:clean    # Clean setup without cache cleaning
```

### Development
```bash
npm run dev            # Start development server with hot reload
npm run serve          # Bundle bridge and start dev server with compilation watching
npm run launch:dev     # Launch Electron app in development mode
npm run launch:dev:traffic    # Development mode with traffic logging
npm run launch:dev:fullheight # Development mode with full height UI
```

### Building and Production
```bash
npm run compile        # Compile TypeScript to ./compiled
npm run compile:watch  # Compile with watch mode
npm run bundle         # Create all bundle targets (bridge, tray, dash, dapp, etc.)
npm run prod           # Full production build and launch
npm run build          # Build distributable for current platform
```

### Testing
```bash
npm run test           # Run all tests (unit + e2e)
npm run test:unit      # Run all unit tests
npm run test:unit:main # Run main process unit tests
npm run test:unit:resources # Run resources unit tests
npm run test:unit:components # Run React component tests
npm run test:e2e       # Run end-to-end tests
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

## Architecture

Frame is an Electron-based Web3 wallet with a multi-process architecture:

### Core Structure
- **`main/`** - Electron main process code handling core functionality
  - `index.ts` - Application entry point with Electron initialization
  - `store/` - Centralized state management using a custom store system
  - `accounts/` - Account management and wallet operations
  - `signers/` - Hardware signer integrations (Ledger, Trezor, GridPlus)
  - `chains/` - Blockchain connection and chain management
  - `provider/` - JSON-RPC provider implementation
  - `dapps/` - DApp permission and interaction handling
  - `windows/` - Window management and UI coordination
  
- **`app/`** - Frontend React applications
  - `tray/` - System tray interface
  - `dash/` - Main dashboard interface  
  - `dapp/` - DApp interaction interface
  - `onboard/` - User onboarding flow
  - `notify/` - Notification interface

- **`resources/`** - Shared utilities and components
  - `Components/` - React components shared across apps
  - `Hooks/` - React hooks for state management
  - `store/` - Store utilities and state management
  - `utils/` - General utility functions
  - `bridge/` - Bridge between main and renderer processes

### Build Targets
Frame uses Parcel to bundle multiple targets:
- `bridge` - Bridge script for communication between processes
- `tray`, `dash`, `dapp`, `onboard`, `notify` - Individual app bundles
- `inject` - DApp injection script

### State Management
- Uses a custom state management system based on `react-restore`
- Store persists to user data directory
- State synchronization between main and renderer processes via bridge

### Hardware Signer Support
- Ledger integration via `@ledgerhq/hw-app-eth`
- Trezor integration via `@trezor/connect`
- GridPlus integration via `gridplus-sdk`
- USB transport layer for hardware communication

### Testing
- Jest for unit testing with multiple environments (node/jsdom)
- Separate test configurations for main process and UI components
- E2E testing with dedicated configuration
- Custom test utilities in `test/` directory

### Development Notes
- TypeScript compilation to `./compiled` directory
- Bundle output to `./bundle` directory
- Uses `npm` (not yarn) - package-lock.json is committed
- Electron version 23 with Node.js 18.12.1+
- Cross-platform support (macOS, Windows, Linux)
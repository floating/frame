<h2 align="center">
  <br>
  <img src="/asset/png/FrameLogo512.png?raw=true" alt="Frame" width="150" />
  <br>
  <br>
  F R A M E
  <br>
  <br>
</h2>

<h3 align="center">A cross-platform Ethereum provider interface :tada:</h3>
<br>
<p align="center">
  <a href="#features">Features</a> ⁃
  <a href="#downloads">Downloads</a> ⁃
  <a href="#try-it">Try It!</a> ⁃
  <a href="#related">Related</a>
</p>
<br>

<img src="/asset/demo/Frame0-0-4.gif?raw=true" />

Frame is an cross-platform Ethereum provider that lets you use standalone signers (such as a Ledger or Trezor) to securely and transparently interact with dapps and the Ethereum network.

### Features
- **First-class Hardware Support**
  - Use your Ledger and Trezor devices with any dapp!
- **Permissions**
  - User controls which dapps have permission to access the provider and can monitor with full transparency what requests dapps are making.
- **Node Management**
  - Frame simplifies running and syncing your local node and lets you seamlessly swap from local to remote nodes on the fly.
- **Menu Bar Support**
  - Frame stays out of the way and sits quietly in your menu bar until it's needed.
- **Cross Platform**
  - macOS, Windows and Linux!

### Demo
  - [Demo from Web3 UX Unconf](https://www.youtube.com/watch?v=3ILPm8qpWfQ)

### Downloads
  - [Prerelease Versions of Frame](https://github.com/floating/frame/releases/tag/prerelease) **(Notice: testnet only, not for mainnet use)**

### Try it!
```bash
# Clone Frame
› git clone https://github.com/floating/frame

# Build Frame
› npm run build

# Run Frame
› npm run alpha
```

**On Windows:** Run `npm install --global --production windows-build-tools` as administrator **before** running the demo. You can find more info about this here: https://github.com/felixrieseberg/windows-build-tools.

**On Ubuntu:** Run `sudo apt-get install libappindicator1` **before** running the demo. You can find more info about this here: https://github.com/electron/electron/issues/1347.

### Related
  - [Restore](https://github.com/floating/restore) - A predictable and observable state container for React apps.

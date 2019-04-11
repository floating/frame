<h2 align="center">
  <br>
  <img src="/asset/png/FrameLogo512.png?raw=true" alt="Frame" width="150" />
  <br>
  <br>
  F R A M E
  <br>
  <br>
</h2>

<h3 align="center">An OS-level Ethereum interface :tada:</h3>
<br>
<h5 align="center">
  <a href="#features">Features</a> ⁃
  <a href="#downloads">Downloads</a> ⁃
  <a href="#related">Related</a>
</h5>
<br>

<img src="/asset/demo/Frame0-0-5-RC1.gif?raw=true" />

Frame is an OS-level Ethereum interface that lets you use standalone signers, such as a Ledger or Trezor, to securely and transparently interact with dapps and the Ethereum network.

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

### Demos
  - [Aracon](https://www.youtube.com/watch?v=wlZWLiy2GD0)

### Downloads
  - [All Releases](https://github.com/floating/frame/releases)

### Run Source
```bash
# Clone
› git clone https://github.com/floating/frame

# Install
› npm install

# Run
› npm run alpha
```

**On Windows:** Run `npm install --global --production windows-build-tools` as administrator **before** running the demo. You can find more info about this here: https://github.com/felixrieseberg/windows-build-tools.

**On Ubuntu:** Run `sudo apt-get install build-essential libudev-dev` **before** running the demo.

### Add Hot Signers
  - **For testing and development purposes** you can add non-hardware accounts to Frame
  - After cloning the repo create **`hot.json`** in the root directory
  ```json
  {
    "accounts": ["privateKey1", "privateKey2"]
  }
  ```
  - Run `npm run hot` (production env + hot signers) or `npm run dev` (development env)
  - Hot signers will not be added when running `npm run alpha` (production env)

### Build Apps
  ```bash
  # Build apps for current platform
  › npm run bundle
  › npm run build
  ```

### Related
  - [Frame Chat](https://gitter.im/framehq/general) - Feel free to drop in and ask questions!
  - [Frame Browser Extension](https://github.com/floating/frame-extension) - Use Frame with any web dapp
  - [eth-provider](https://github.com/floating/eth-provider) - A universal Ethereum provider
  - [Restore](https://github.com/floating/restore) - A predictable and observable state container for React apps

<h2>
<h5 align="center">
  <br>
  <a href="https://frame.sh">Website</a> ⁃
  <a href="https://medium.com/@framehq">Blog</a> ⁃
  <a href="https://twitter.com/frame_eth">Twitter</a>
</h5>
</h2>

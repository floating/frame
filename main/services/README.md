# Services

## Class: Service

Handles duties that are common to all services, e.g. downloads, updates, child processes etc.

## Class: Geth

### Methods

- `start()`
  - Starts client. Updates/installs before starting if needed.
- `stop()`
  - Terminates client.

### Client states

- `off`
  - Process not running.
- `updating`
  - New version is being downloaded and installed.
- `syncing`
  - Downloading blocks (or block headers).
- `ready`
  - Ready to be used.
- `terminating`
  - Process is shutting down.

### Store

- `main.clients.geth.`
  - `on <BOOLEAN>`
    - On/off switch toggled in UI
  - `mode <STRING>`
    - Syncmode: 'light' or 'fast'
  - `networkId <STRING>`
    - Numerical network identifier (e.g. '4' for Rinkeby)
  - `latest <BOOLEAN>`
    - Client up to date?
  - `installed <BOOLEAN>`
    - Client installed?
  - `version <STRING>`
    - Currently installed version
  - `state <STRING>`
    - Client state (see above)
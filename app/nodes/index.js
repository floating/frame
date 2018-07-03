// scan for avliable local nodes

// scan for providers

// Ethereum Connection

// Local Nodes

// Remote Nodes

// Frame will always try use local nodes first and fallback to your remote nodes when a localnode is unavliale or out of sync.

// + buttons on each section to add a remote or local node

// Frame will use your locally selected node by default and relay on your remote node only when your local note is unavailable or out of sync.
// * notification when using remote node…
//
// Scan for locally running nodes and let the user choose their preferred local node to
//
// If you have a locally running node running, Frame will default to this  we will use it when it is in sync.
//
// If you don’t have any local node running, or if your local node is not in sync we will use the remote provider,  select below.
//
//  Remember to check for need to build form source  (Prebuilt vs node-gyp)
//
// // check browser for capabilities
//
// If  (url)  {
//  only connect to url
// }  else  {
//   try to connect to frame ws
//   try to connect to frame http
//   if (node) try to connect to geth ipc
//   try to connect to geth ws
//   try to connect to geth http
//   if (node) try to connect to geth ipc
//   try to connect to geth ws
//   try to connect to geth http
// }

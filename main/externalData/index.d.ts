interface ChainDefinition {
  type: 'ethereum',
  id: number,
  name: string,
  nativeCurrency: string,
  rpcUrls: string[],
  blockExplorerUrls: string[], 
  iconUrls: string[]
}

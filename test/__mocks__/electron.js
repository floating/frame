module.exports = {
  app: {
    on: jest.fn(),
    getName: () => 'Frame Test App',
    getVersion: () => '1.0',
    getPath: process.cwd
  }
}

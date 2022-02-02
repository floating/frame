declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUNDLE_LOCATION: string
      NODE_ENV: 'test' | 'development' | 'production'
    }
  }
}

export {}

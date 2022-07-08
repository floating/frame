declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUNDLE_LOCATION?: string
      NODE_ENV?: 'test' | 'development' | 'production',
      // use this to override the log level in development
      LOG_LEVEL?: 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error'
    }
  }
}

export {}

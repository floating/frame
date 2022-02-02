declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUNDLE_LOCATION: string
      NODE_ENV: 'test' | 'development' | 'production'
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}

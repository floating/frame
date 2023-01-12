import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
<<<<<<< HEAD
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
=======
import importPlugin from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import testingLibraryReact from 'eslint-plugin-testing-library/configs/react.js'
>>>>>>> ba76bb9b (move to flat config)
import testingLibrary from 'eslint-plugin-testing-library'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  'eslint:recommended',
<<<<<<< HEAD
  // All files
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
=======
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    plugins: {
      import: importPlugin
    },
>>>>>>> ba76bb9b (move to flat config)
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es6
      }
    },
<<<<<<< HEAD
    rules: {
      ...prettier.rules,
      'no-unused-vars': ['error', { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }]
    }
  },
  // Main process files and scripts
=======
    settings: {
      'import/resolver': {
        node: true
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      }
    },
    rules: {
      ...prettier.rules,
      ...importPlugin.configs.recommended.rules,
      'import/no-unresolved': 'off',
      'import/extensions': ['error', { js: 'never', ts: 'never', mjs: 'always', json: 'always' }],
      'no-unused-vars': ['error', { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }]
    }
  },
>>>>>>> ba76bb9b (move to flat config)
  {
    files: ['**/*.{js,mjs,ts}'],
    ignores: ['app/**/*', 'resources/Components/**/*'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
<<<<<<< HEAD
  // TS files
=======
>>>>>>> ba76bb9b (move to flat config)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': ts
    },
<<<<<<< HEAD
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'off' // redundant - TS will fail to compile with undefined vars
    }
  },
  // React / JSX files
=======
    settings: {
      'import/resolver': {
        typescript: true
      }
    },
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs['recommended'].rules,
      ...importPlugin.configs.typescript.rules,
      'no-undef': 'off' // redundant rule - TS will fail to compile with undefined vars
    }
  },
>>>>>>> ba76bb9b (move to flat config)
  {
    files: [
      'app/**/*.js',
      'resources/Components/**/*.js',
      'resources/svg/index.js',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js',
      'test/jest.svg.js'
    ],
    plugins: {
      react,
      'react-hooks': reactHooks
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off' // all type checking to be done in TS
    }
  },
<<<<<<< HEAD
  // Renderer process files
=======
>>>>>>> ba76bb9b (move to flat config)
  {
    files: [
      'app/**/*.js',
      'resources/**/*.{js,ts,tsx}',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
<<<<<<< HEAD
  // Test files
=======
>>>>>>> ba76bb9b (move to flat config)
  {
    files: ['test/**/*', '**/__mocks__/**/*'],
    plugins: {
      jest
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
    // TODO: enable jest rules
    // rules: {
    //   ...jest.configs.recommended.rules
    // }
  },
<<<<<<< HEAD
  // Components test files
=======
>>>>>>> ba76bb9b (move to flat config)
  {
    files: ['test/app/**/*.js', 'test/resources/Components/**/*.js', 'app/**/__mocks__/**'],
    plugins: {
      'testing-library': testingLibrary
    },
    rules: {
<<<<<<< HEAD
      ...testingLibrary.configs.react.rules
=======
      ...testingLibraryReact.rules
>>>>>>> ba76bb9b (move to flat config)
    }
  }
]

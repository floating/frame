import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
<<<<<<< HEAD
<<<<<<< HEAD
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
=======
import importPlugin from 'eslint-plugin-import'
=======
>>>>>>> a89d5963 (remove eslint-plugin-import)
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
<<<<<<< HEAD
import testingLibraryReact from 'eslint-plugin-testing-library/configs/react.js'
>>>>>>> ba76bb9b (move to flat config)
=======
>>>>>>> e14013c9 (standardise config import)
import testingLibrary from 'eslint-plugin-testing-library'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  'eslint:recommended',
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> bf9d16c6 (add comments)
  // All files
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
=======
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
<<<<<<< HEAD
    plugins: {
      import: importPlugin
    },
>>>>>>> ba76bb9b (move to flat config)
=======
>>>>>>> a89d5963 (remove eslint-plugin-import)
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es6
      }
    },
<<<<<<< HEAD
<<<<<<< HEAD
    rules: {
      ...prettier.rules,
      'no-unused-vars': ['error', { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }]
    }
  },
  // Main process files and scripts
<<<<<<< HEAD
=======
    settings: {
      'import/resolver': {
        node: true
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      }
    },
=======
>>>>>>> a89d5963 (remove eslint-plugin-import)
    rules: {
      ...prettier.rules,
      'no-unused-vars': ['error', { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }]
    }
  },
>>>>>>> ba76bb9b (move to flat config)
=======
>>>>>>> bf9d16c6 (add comments)
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
<<<<<<< HEAD
  // TS files
=======
>>>>>>> ba76bb9b (move to flat config)
=======
  // TS files
>>>>>>> bf9d16c6 (add comments)
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
<<<<<<< HEAD
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'off', // redundant - TS will fail to compile with undefined vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, destructuredArrayIgnorePattern: '^_' }
      ]
    }
  },
  // React / JSX files
=======
    settings: {
      'import/resolver': {
        typescript: true
      }
    },
=======
>>>>>>> a89d5963 (remove eslint-plugin-import)
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'off' // redundant - TS will fail to compile with undefined vars
    }
  },
<<<<<<< HEAD
>>>>>>> ba76bb9b (move to flat config)
=======
  // React / JSX files
>>>>>>> bf9d16c6 (add comments)
  {
    files: [
      'app/**/*.js',
      'resources/Components/**/*.js',
      'resources/Native/**/*.js',
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
<<<<<<< HEAD
  // Renderer process files
=======
>>>>>>> ba76bb9b (move to flat config)
=======
  // Renderer process files
>>>>>>> bf9d16c6 (add comments)
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
<<<<<<< HEAD
  // Test files
=======
>>>>>>> ba76bb9b (move to flat config)
=======
  // Test files
>>>>>>> bf9d16c6 (add comments)
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
<<<<<<< HEAD
  // Components test files
=======
>>>>>>> ba76bb9b (move to flat config)
=======
  // Components test files
>>>>>>> bf9d16c6 (add comments)
  {
    files: ['test/app/**/*.js', 'test/resources/Components/**/*.js', 'app/**/__mocks__/**'],
    plugins: {
      'testing-library': testingLibrary
    },
    rules: {
<<<<<<< HEAD
<<<<<<< HEAD
      ...testingLibrary.configs.react.rules
=======
      ...testingLibraryReact.rules
>>>>>>> ba76bb9b (move to flat config)
=======
      ...testingLibrary.configs.react.rules
>>>>>>> e14013c9 (standardise config import)
    }
  }
]

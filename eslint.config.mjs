import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import testingLibrary from 'eslint-plugin-testing-library'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  'eslint:recommended',
  // Ignored dirs
  {
    ignores: ['dist/**/*', 'compiled/**/*', 'bundle/**/*']
  },
  // Temporary ignored dirs - TODO: remove on rewrite
  {
    ignores: ['main/signers/**/*']
  },
  // All files
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es2021
      }
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ]
    }
  },
  // Main process files and scripts
  {
    files: ['**/*.{js,mjs,ts}'],
    ignores: ['app/**/*', 'resources/Components/**/*'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  // Renderer process files
  {
    files: [
      'app/**/*.js',
      'main/dapps/server/inject/*.js',
      'resources/**/*.{js,ts,tsx}',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: true,
        global: true
      }
    }
  },
  // TS files
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
    rules: {
      ...ts.configs['eslint-recommended'].rules,
      ...ts.configs.recommended.rules,
      'no-undef': 'off', // redundant - TS will fail to compile with undefined vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }], // allow noop arrow functions, e.g. in a method signature for ensuring a parameter defaults to a function
      '@typescript-eslint/prefer-namespace-keyword': 'off', // use ES module syntax instead of namespace
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }]
    }
  },
  // React / JSX files
  // TODO: simplify as '**/*.{jsx,tsx}'
  {
    files: [
      'app/**/*.js',
      'resources/Components/**/*.js',
      'resources/Native/**/*.js',
      'resources/svg/index.js',
      'test/app/**/*.js',
      'test/resources/Components/**/*.js',
      'test/resources/Hooks/**/*.js',
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
  // Test files
  {
    files: ['test/**/*.js', '**/__mocks__/**/*.js'],
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
  // Components test files
  {
    files: ['test/app/**/*.js', 'test/resources/Components/**/*.js', 'app/**/__mocks__/**/*.js'],
    plugins: {
      'testing-library': testingLibrary
    },
    rules: {
      ...testingLibrary.configs.react.rules
    }
  },
  // ensure all rules work with prettier 
  prettier
]

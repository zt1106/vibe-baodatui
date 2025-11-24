import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tsProjects = ['./tsconfig.base.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'];

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '.next/**',
      'apps/web/.next/**',
      '**/*.d.ts'
    ]
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      },
      globals: {
        ...globals.es2023,
        ...globals.node,
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off',
      indent: ['error', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      semi: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'object-curly-spacing': ['error', 'always'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-redeclare': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    files: ['apps/web/**/*.{ts,tsx,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2023
      },
      parser: tseslint.parser,
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.strict.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2]
    }
  },
  {
    files: ['packages/ui-cards/**/*.{ts,tsx,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2023
      },
      parser: tseslint.parser,
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.strict.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2]
    }
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        project: null
      }
    }
  },
  {
    files: ['apps/web/.storybook/**/*'],
    languageOptions: {
      parserOptions: {
        project: null
      }
    }
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.{ts,tsx}', 'apps/web/tests/**/*'],
    rules: {
      'no-console': 'off'
    }
  }
);

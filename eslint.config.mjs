import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  nextjs: true,
  typescript: true,
  jsonc: false,
  yaml: false,
  markdown: false,
  ignores: [
    '**/.agents/**',
    '**/.github/**',
    '**/.vscode/**',
    '**/*.config.{js,ts,mjs,cjs}',
    '**/*.cjs',
    '**/src-tauri/**',
    '**/safelists/**',
    '**/patches/**',
    'scripts/**',
    'apps/app/generate-*.cjs',
    'apps/app/generate-*.js',
  ],
}, {
  rules: {
    // Relax some overly strict rules
    'react-hooks-extra/no-direct-set-state-in-use-effect': 'off',
    'react-refresh/only-export-components': 'off',
    'style/multiline-ternary': 'off',
    'react/prefer-use-state-lazy-initialization': 'off',
    // Fix the pages warning for Next.js
    'no-html-link-for-pages': 'off',
    'next/no-html-link-for-pages': 'off',
    // Next.js uses process.env heavily
    'node/prefer-global/process': 'off',
    // Allow console, alerts, and nested components for convenience
    'no-console': 'off',
    'no-alert': 'off',
    'react/no-nested-component-definitions': 'off',
    // Turn off unused vars check (too strict for development)
    'unused-imports/no-unused-vars': 'off',
    'ts/no-use-before-define': 'off',
    // Allow sync scripts for API docs page
    'next/no-sync-scripts': 'off',
    // Disable other warnings for cleaner output
    'react/no-array-index-key': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-naming-convention/use-state': 'off',
    'jsdoc/check-param-names': 'off',
    'react-dom/no-dangerously-set-innerhtml': 'off',
  },
})

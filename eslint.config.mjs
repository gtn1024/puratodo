import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  nextjs: true,
  typescript: true,
  jsonc: false,
  yaml: false,
  markdown: false,
}, {
  ignores: [
    '**/.agents/**',
    '**/.github/**',
    '**/.vscode/**',
    '**/*.config.{js,ts,mjs,cjs}',
    '**/*.cjs',
    '**/src-tauri/**',
    '**/safelists/**',
    '**/patches/**',
  ],
})

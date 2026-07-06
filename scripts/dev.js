const { spawnSync } = require('child_process')
const path = require('path')

const result = spawnSync('npm', ['start'], {
  cwd: path.resolve(__dirname, '..', 'electron'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GENEALOGIE_DEV: 'true' },
})

process.exit(result.status ?? 1)

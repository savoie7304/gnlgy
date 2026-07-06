const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')

function run(cmd, cwd) {
  console.log(`[build] ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit', shell: true })
}

console.log('=== Building frontend ===')
run('npm run build', path.join(ROOT, 'frontend'))

console.log('=== Copying to backend static ===')
const staticDir = path.join(ROOT, 'backend', 'src', 'main', 'resources', 'static')
fs.rmSync(staticDir, { recursive: true, force: true })
fs.cpSync(path.join(ROOT, 'frontend', 'dist'), staticDir, { recursive: true })

console.log('=== Building backend JAR ===')
run('mvn package -DskipTests -q', path.join(ROOT, 'backend'))

console.log('=== Copying JAR to electron/ ===')
fs.cpSync(
  path.join(ROOT, 'backend', 'target', 'backend-1.0.0.jar'),
  path.join(ROOT, 'electron', 'genealogie.jar')
)

console.log('=== Installing Electron dependencies ===')
run('npm install', path.join(ROOT, 'electron'))

console.log('\n=== Done ===')
console.log('Run: cd electron && npm start')

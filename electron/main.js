const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

const DEV = process.env.GENEALOGIE_DEV === 'true'
const PORT = 8080
const URL = DEV ? 'http://localhost:5173' : `http://localhost:${PORT}`
const JAR_NAME = 'genealogie.jar'

let javaProcess = null
let mainWindow = null

function startBackend() {
  const jarPath = DEV
    ? path.join(__dirname, '..', 'backend', 'target', JAR_NAME)
    : path.join(app.isPackaged ? process.resourcesPath : __dirname, JAR_NAME)

  javaProcess = spawn('java', ['-jar', jarPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  javaProcess.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  javaProcess.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`))
  javaProcess.on('exit', (code) => {
    if (code !== 0) console.error(`Backend exited with code ${code}`)
  })
}

async function waitForBackend(retries = 30, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}/api/trees`, (res) => {
          if (res.statusCode < 500) resolve()
          else reject(new Error(`status ${res.statusCode}`))
        })
        req.on('error', reject)
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')) })
      })
      return true
    } catch {
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Backend did not start in time')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.loadURL(URL)
  if (DEV) mainWindow.webContents.openDevTools()
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  if (!DEV) {
    startBackend()
    try {
      await waitForBackend()
    } catch (e) {
      console.error(e.message)
      app.quit()
      return
    }
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (javaProcess) {
    javaProcess.kill()
    javaProcess = null
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (javaProcess) {
    javaProcess.kill()
    javaProcess = null
  }
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

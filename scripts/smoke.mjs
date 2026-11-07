import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const ART = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts'
const CHROME = process.env.CHROME || '/usr/local/bin/google-chrome'
const outDir = path.join(ART, 'screenshots')

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

async function overflow(page) {
  return page.evaluate(() => {
    const phone = document.querySelector('.phone')
    const root = document.documentElement
    return {
      phone: phone ? phone.scrollWidth - phone.clientWidth : null,
      page: root.scrollWidth - root.clientWidth,
    }
  })
}

async function shot(page, name) {
  const file = path.join(outDir, name)
  await page.screenshot({ path: file, type: 'png' })
  return file
}

const port = await freePort()
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
})
let previewLog = ''
preview.stdout.on('data', (b) => {
  previewLog += b
})
preview.stderr.on('data', (b) => {
  previewLog += b
})

const deadline = Date.now() + 15000
while (Date.now() < deadline) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`)
    if (res.ok) break
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 200))
}

await mkdir(outDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
})

const report = { emulation: true, physicalIphone: false, checks: [] }

function record(name, ok, detail) {
  report.checks.push({ name, ok, detail })
  if (!ok) console.error('FAIL', name, detail)
  else console.log('ok', name)
}

try {
  const page = await browser.newPage()
  page.on('dialog', (d) => d.accept())
  const viewports = [
    ['iphone14', 390, 844],
    ['iphone-se', 375, 667],
    ['iphone16', 402, 874],
  ]
  for (const [name, width, height] of viewports) {
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="brew-screen"]')
    if (name === 'iphone14') await new Promise((r) => setTimeout(r, 1600))
    const brew = await overflow(page)
    record(`${name} brew no horizontal overflow`, brew.phone <= 1 && brew.page <= 1, brew)
    if (name === 'iphone14') await shot(page, 'brew-iphone14.png')
    await page.click('#tab-journal')
    await page.waitForSelector('[data-testid="journal-screen"] .leaflet-container', { timeout: 8000 })
    await new Promise((r) => setTimeout(r, 600))
    const journal = await overflow(page)
    record(`${name} journal no horizontal overflow`, journal.phone <= 1 && journal.page <= 1, journal)
    if (name === 'iphone14') await shot(page, 'journal-iphone14.png')
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' })
  await page.click('[data-testid="pour"]')
  await new Promise((r) => setTimeout(r, 400))
  const live = await page.$eval('[data-testid="cup-stage"]', (el) => el.getAttribute('data-cup-mode'))
  record('pour sets the cup loop running', live === 'live', { live })
  await shot(page, 'brew-pouring.png')
  await page.click('[data-testid="detail-open"]')
  await page.waitForSelector('dialog.drawer[open]')
  await new Promise((r) => setTimeout(r, 1800))
  await shot(page, 'brew-detail.png')
  await page.keyboard.press('Escape')

  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.reload({ waitUntil: 'domcontentloaded' })
  const still = await page.$eval('[data-testid="cup-stage"]', (el) => el.getAttribute('data-cup-mode'))
  record('reduced motion keeps the cup still', still === 'still', { still })
  await shot(page, 'brew-reduced-motion.png')
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])

  await page.click('#tab-journal')
  await page.waitForSelector('[data-testid="add-coffee"]')
  await page.click('[data-testid="add-coffee"]')
  await page.click('[data-testid="drop-centre"]')
  await page.type('[data-testid="visit-name"]', 'Test Café')
  const file = await page.$('input[type="file"]')
  await file.uploadFile(path.join(process.cwd(), 'public/icons/icon-512.png'))
  await page.waitForSelector('.photo-row img')
  await page.click('[data-testid="save-visit"]')
  await page.waitForSelector('[data-testid="place-card"]')
  await page.waitForSelector('.ppin.is-selected img')
  const cardSrc = await page.$eval('[data-testid="place-photo"]', (img) => img.getAttribute('src'))
  const pinSrc = await page.$eval('.ppin.is-selected img', (img) => img.getAttribute('src'))
  record('selected pin matches the card photo', !!cardSrc && cardSrc === pinSrc, {
    card: cardSrc?.slice(0, 32),
    pin: pinSrc?.slice(0, 32),
  })
  await shot(page, 'journal-added.png')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.click('#tab-journal')
  await page.waitForSelector('[data-testid="all-visits"]')
  await page.click('[data-testid="all-visits"]')
  const kept = await page.waitForFunction(() => document.body.innerText.includes('Test Café'), { timeout: 5000 }).then(
    () => true,
    () => false,
  )
  record('visit persists after reload', kept, { kept })
  const edited = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('Edit Test'))
    if (!btn) return false
    btn.click()
    return true
  })
  record('edit control is in the visit list', edited, { edited })
  if (!edited) throw new Error('edit button missing')
  const name = await page.$('[data-testid="visit-name"]')
  await name.click({ clickCount: 3 })
  await name.type('Test Café Edited')
  await page.click('[data-testid="save-visit"]')
  await page.waitForFunction(() => document.body.innerText.includes('Test Café Edited'))
  record('edit saves a new name', true, {})
  await shot(page, 'journal-edited.png')

  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.ready
    return !!reg.active
  })
  record('service worker activates on http', swReady, { swReady })

  await page.setCacheEnabled(false)
  await page.setOfflineMode(true)
  await page.reload({ waitUntil: 'domcontentloaded' }).catch((err) => {
    report.offlineReloadError = String(err)
  })
  const offlineBrew = await page.$('[data-testid="brew-screen"]').then(Boolean).catch(() => false)
  record('offline reload still shows brew shell', offlineBrew, { offlineBrew, err: report.offlineReloadError })
  if (offlineBrew) {
    await page.click('#tab-journal').catch(() => {})
    const note = await page
      .waitForFunction(() => document.body.innerText.includes('Map tiles need an internet connection'), { timeout: 6000 })
      .then(() => true, () => false)
    record('offline journal explains missing tiles', note, { note })
    await shot(page, 'journal-offline.png')
  }
} finally {
  await browser.close()
  preview.kill('SIGTERM')
  preview.unref()
}

const failed = report.checks.filter((c) => !c.ok)
await writeFile(path.join(ART, 'smoke-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (failed.length) console.error(previewLog.slice(-2000))
process.exit(failed.length ? 1 : 0)

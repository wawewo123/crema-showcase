import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const outDir = process.env.ARTIFACT_DIR || '/opt/cursor/artifacts/screenshots'
const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })

const port = await freePort()
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
})
const deadline = Date.now() + 15000
while (Date.now() < deadline) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`)
    if (res.ok) break
  } catch {
    /* wait */
  }
  await new Promise((r) => setTimeout(r, 200))
}

await mkdir(outDir, { recursive: true })
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
})
const page = await browser.newPage()
const shot = (name) => page.screenshot({ path: path.join(outDir, name) })
const overflow = () =>
  page.evaluate(() => {
    const phone = document.querySelector('.phone')
    return phone ? phone.scrollWidth - phone.clientWidth : 99
  })

try {
  for (const width of [375, 390, 402]) {
    await page.setViewport({ width, height: width === 402 ? 874 : 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await page.goto(`http://127.0.0.1:${port}/#dial`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-testid="dial-screen"]')
    const extra = await overflow()
    if (extra > 1) throw new Error(`overflow ${width}: ${extra}`)
    console.log('ok width', width)
  }

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(`http://127.0.0.1:${port}/#dial`, { waitUntil: 'domcontentloaded' })
  await page.click('[data-testid="open-kits"]')
  await page.click('[data-testid="add-setup"]')
  await page.click('[data-testid="choose-machine"]')
  await page.waitForSelector('[data-testid="kit-picker"]')
  await shot('dial-kit-picker.png')
  await page.click('[data-testid="pick-gaggia-classic-pro-e24"]')
  await page.waitForSelector('[data-testid="fill-pid"]')
  await page.select('[data-testid="fill-pid"]', 'no')
  await page.click('[data-testid="save-override"]')
  await page.waitForFunction(() => document.body.innerText.includes('added by you'))
  await shot('dial-spec-override.png')
  await page.click('button::-p-text(Back)')
  await page.click('[data-testid="choose-grinder"]')
  await page.click('[data-testid="pick-baratza-encore-esp"]')
  await page.click('button::-p-text(Back)')
  await page.click('[data-testid="open-beans"]')
  await page.click('[data-testid="add-bean"]')
  await page.type('[data-testid="bean-roaster"]', 'Square Mile')
  await page.type('[data-testid="bean-origin"]', 'Blend, London')
  await shot('dial-bean-entry.png')
  await page.click('[data-testid="save-bean"]')
  await page.click('[data-testid="method-v60"]')
  await page.click('[data-testid="start-brew"]')
  await page.click('[data-testid="timer-start"]')
  await new Promise((r) => setTimeout(r, 1200))
  await shot('dial-v60-timer.png')
  await page.click('[data-testid="guide-back"]')
  await page.click('[data-testid="method-espresso"]')
  await page.click('[data-testid="start-brew"]')
  await page.click('[data-testid="timer-start"]')
  await new Promise((r) => setTimeout(r, 400))
  await page.click('[data-testid="timer-next"]')
  await page.click('[data-testid="sour-1"]')
  await page.waitForFunction(() => document.body.innerText.includes('Grind 2 steps finer'))
  await shot('dial-espresso-suggestion.png')
  await page.click('[data-testid="save-brew"]')
  await page.waitForSelector('[data-testid="history"]')
  await shot('dial-history.png')
  console.log('shots ok')
} finally {
  await browser.close()
  preview.kill('SIGTERM')
  preview.unref()
}
process.exit(0)

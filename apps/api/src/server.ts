import 'dotenv/config'

console.log('=== TRILHAS API BOOT ===')
console.log('Node:', process.version)
console.log('PORT env:', process.env.PORT)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL)

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
  process.exit(1)
})

async function main() {
  console.log('[1] Importing app...')
  let app: any
  try {
    const mod = await import('./app')
    app = mod.default
    console.log('[2] App imported OK')
  } catch (err) {
    console.error('[FATAL] Failed to import app:', err)
    process.exit(1)
  }

  const PORT = parseInt(process.env.PORT || '3001', 10)
  const HOST = '0.0.0.0'
  console.log(`[3] Binding to ${HOST}:${PORT}`)

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => {
      console.log(`[4] ✅ Server listening on ${HOST}:${PORT}`)
      console.log(`[5] Health check: http://${HOST}:${PORT}/health`)
      resolve()
    })

    server.on('error', (err: any) => {
      console.error('[FATAL] server.listen error:', err)
      reject(err)
    })

    process.on('SIGTERM', () => {
      console.log('[SHUTDOWN] SIGTERM')
      server.close(() => process.exit(0))
      setTimeout(() => process.exit(1), 10_000)
    })
  })
}

main().catch((err) => {
  console.error('[FATAL] main() crashed:', err)
  process.exit(1)
})

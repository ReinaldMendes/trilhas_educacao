import 'dotenv/config'

// Log every step so Railway deploy logs show exactly where it stops
console.log('=== TRILHAS API BOOT ===')
console.log('Node:', process.version)
console.log('PORT:', process.env.PORT || '3001')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL)

// Catch everything — never let an unhandled error kill the process silently
process.on('uncaughtException',   (err) => console.error('[uncaughtException]', err))
process.on('unhandledRejection',  (reason) => console.error('[unhandledRejection]', reason))

async function main() {
  console.log('[1] Loading app...')
  const { default: app } = await import('./app')
  console.log('[2] App loaded')

  const PORT = parseInt(process.env.PORT || '3001', 10)
  const HOST = '0.0.0.0'

  console.log(`[3] Starting server on ${HOST}:${PORT}...`)

  return new Promise<void>((resolve) => {
    const server = app.listen(PORT, HOST, () => {
      console.log(`[4] ✅ Server UP — http://${HOST}:${PORT}`)
      console.log(`[5]    Health: http://${HOST}:${PORT}/health`)
      resolve()
    })

    server.on('error', (err) => {
      console.error('[ERROR] Server failed to start:', err)
      // Don't exit — log and try to keep running
    })

    // Graceful shutdown
    const shutdown = (sig: string) => {
      console.log(`[SHUTDOWN] ${sig} received`)
      server.close(() => { console.log('[SHUTDOWN] Done'); process.exit(0) })
      setTimeout(() => process.exit(1), 10_000)
    }
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
  })
}

main().catch((err) => {
  console.error('[FATAL] main() threw:', err)
  // Still don't exit — keep process alive so Railway sees the logs
})

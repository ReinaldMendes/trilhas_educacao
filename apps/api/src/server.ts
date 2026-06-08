import 'dotenv/config'
import app from './app'

// Railway injects PORT dynamically — must use it or healthcheck fails
const PORT = parseInt(process.env.PORT || '3001', 10)
const HOST = '0.0.0.0'

console.log(`Starting Trilhas API...`)
console.log(`PORT=${PORT}, HOST=${HOST}, NODE_ENV=${process.env.NODE_ENV}`)
console.log(`DATABASE_URL set: ${!!process.env.DATABASE_URL}`)

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Trilhas API listening on ${HOST}:${PORT}`)
  console.log(`   Health: http://${HOST}:${PORT}/health`)
})

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error('❌ Server error:', err.message)
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
  }
  process.exit(1)
})

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`)
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Force shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
  process.exit(1)
})

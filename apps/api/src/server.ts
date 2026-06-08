import 'dotenv/config'
import app from './app'

const PORT = parseInt(process.env.PORT || '3001', 10)

async function start() {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌿 Trilhas API running on port ${PORT}`)
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`   Health: http://0.0.0.0:${PORT}/health`)
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down...')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()

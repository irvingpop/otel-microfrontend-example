#!/usr/bin/env node

import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const services = [
  { name: 'ui-service-shell', port: 8080, workspace: 'ui-service-shell' },
  { name: 'weather-service', port: 8081, workspace: 'weather-service' },
  { name: 'traffic-service', port: 8082, workspace: 'traffic-service' },
  { name: 'transit-service', port: 8083, workspace: 'transit-service' },
  { name: 'energy-service', port: 8084, workspace: 'energy-service' }
]

const runningProcesses = new Map()

async function killProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    if (stdout.trim()) {
      const pids = stdout.trim().split('\n')
      for (const pid of pids) {
        try {
          process.kill(parseInt(pid), 'SIGTERM')
          console.log(`✅ Killed process ${pid} on port ${port}`)
        } catch (err) {
          console.log(`⚠️  Process ${pid} already dead`)
        }
      }
    }
  } catch (err) {
    // No process running on port
  }
}

async function startService(service) {
  console.log(`🚀 Starting ${service.name} on port ${service.port}...`)
  
  const child = spawn('npm', ['run', 'dev', `--workspace=${service.workspace}`], {
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: false
  })

  runningProcesses.set(service.name, child)

  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`)
  })

  child.stderr.on('data', (data) => {
    console.error(`[${service.name}] ${data.toString().trim()}`)
  })

  child.on('close', (code) => {
    console.log(`❌ ${service.name} exited with code ${code}`)
    runningProcesses.delete(service.name)
  })

  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${service.port}`)
        if (stdout.trim() === '200') {
          console.log(`✅ ${service.name} is ready on http://localhost:${service.port}`)
          clearInterval(checkInterval)
          resolve(child)
        }
      } catch (err) {
        // Service not ready yet
      }
    }, 1000)

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval)
      console.log(`⚠️  ${service.name} took too long to start`)
      resolve(child)
    }, 30000)
  })
}

async function stopAllServices() {
  console.log('🛑 Stopping all services...')
  
  // Kill processes by port
  for (const service of services) {
    await killProcessOnPort(service.port)
  }

  // Kill spawned processes
  for (const [name, process] of runningProcesses) {
    try {
      process.kill('SIGTERM')
      console.log(`✅ Stopped ${name}`)
    } catch (err) {
      console.log(`⚠️  Failed to stop ${name}`)
    }
  }

  runningProcesses.clear()
}

async function startAllServices() {
  console.log('🏗️  Starting Smart City Dashboard services...\n')

  // Clean up any existing processes
  await stopAllServices()
  
  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Start services in order
  for (const service of services) {
    await startService(service)
    // Small delay between services
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n🎉 All services started!')
  console.log('\n📊 Dashboard: http://localhost:8080')
  console.log('\n🔗 Individual services:')
  services.slice(1).forEach(service => {
    console.log(`   ${service.name}: http://localhost:${service.port}`)
  })
  
  console.log('\nPress Ctrl+C to stop all services')
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down services...')
  await stopAllServices()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await stopAllServices()
  process.exit(0)
})

// Handle command line arguments
const command = process.argv[2]

switch (command) {
  case 'start':
    startAllServices()
    break
  case 'stop':
    stopAllServices().then(() => process.exit(0))
    break
  case 'restart':
    stopAllServices().then(() => {
      setTimeout(startAllServices, 2000)
    })
    break
  default:
    console.log('Usage: node dev-services.js [start|stop|restart]')
    console.log('  start   - Start all services')
    console.log('  stop    - Stop all services') 
    console.log('  restart - Restart all services')
    process.exit(1)
}
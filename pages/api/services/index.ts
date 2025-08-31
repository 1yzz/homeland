import type { NextApiRequest, NextApiResponse } from 'next'
import { WatchdogClient, type ServiceRegistration } from 'watchdog-grpc-sdk'

let watchdogClient: WatchdogClient | null = null

function getClient() {
  if (!watchdogClient) {
    try {
      watchdogClient = new WatchdogClient({
        host: process.env.WATCHDOG_HOST || 'localhost',
        port: parseInt(process.env.WATCHDOG_PORT || '50051', 10),
        timeout: parseInt(process.env.WATCHDOG_TIMEOUT || '10000', 10),
      })
    } catch (error) {
      console.error('Failed to create WatchdogClient:', error)
      throw new Error('Unable to connect to Watchdog service')
    }
  }
  return watchdogClient
}

// Helper function to transform protobuf services to plain objects
function transformServices(services: any[]): any[] {
  return services.map((service, index) => {
    try {
      // Try to use protobuf methods first
      if (service.getId && typeof service.getId === 'function') {
        return {
          id: service.getId() || `service-${index}`,
          name: service.getName?.() || 'Unknown Service',
          endpoint: service.getEndpoint?.() || 'Unknown Endpoint',
          status: service.getStatus?.() || 'unknown',
          type: service.getType?.() || 0,
          timestamp: Date.now(),
        }
      }
      
      // Fallback to direct properties
      return {
        id: service.id || `service-${index}`,
        name: service.name || 'Unknown Service',
        endpoint: service.endpoint || 'Unknown Endpoint',
        status: service.status || 'unknown',
        type: service.type || 0,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.warn('Failed to transform service:', error)
      return {
        id: `service-${index}`,
        name: 'Unknown Service',
        endpoint: 'Unknown Endpoint',
        status: 'error',
        type: 0,
        timestamp: Date.now(),
      }
    }
  })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = getClient()

    switch (req.method) {
      case 'GET': {
        try {
          // List services
          const rawServices = await client.listServices()
          const services = transformServices(rawServices || [])
          
          res.status(200).json({ 
            services,
            count: services.length,
            timestamp: Date.now()
          })
        } catch (error) {
          console.error('Failed to list services:', error)
          res.status(500).json({ 
            error: 'Failed to retrieve services',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break
      }

      case 'POST': {
        try {
          // Validate request body
          const serviceData: ServiceRegistration = req.body
          
          if (!serviceData || typeof serviceData !== 'object') {
            return res.status(400).json({ 
              error: 'Invalid request body',
              details: 'Request body must be a valid JSON object'
            })
          }
          
          if (!serviceData.name || !serviceData.endpoint || serviceData.type === undefined) {
            return res.status(400).json({ 
              error: 'Missing required fields',
              details: 'Fields required: name (string), endpoint (string), type (number)',
              received: {
                name: typeof serviceData.name,
                endpoint: typeof serviceData.endpoint,
                type: typeof serviceData.type
              }
            })
          }
          
          // Register service
          const result = await client.registerService(serviceData)
          
          res.status(201).json({
            success: true,
            ...result,
            timestamp: Date.now()
          })
        } catch (error) {
          console.error('Failed to register service:', error)
          res.status(500).json({ 
            error: 'Failed to register service',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break
      }

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        res.status(405).json({
          error: `Method ${req.method} Not Allowed`,
          allowedMethods: ['GET', 'POST']
        })
    }
  } catch (error) {
    console.error('API handler error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { WatchdogClient, type ServiceUpdate } from 'watchdog-grpc-sdk'

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

function validateServiceId(serviceId: unknown): string {
  if (typeof serviceId !== 'string' || !serviceId.trim()) {
    throw new Error('Invalid service ID: must be a non-empty string')
  }
  return serviceId.trim()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { serviceId: rawServiceId } = req.query
    
    // Validate service ID
    let serviceId: string
    try {
      serviceId = validateServiceId(rawServiceId)
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid service ID',
        details: error instanceof Error ? error.message : 'Service ID must be provided'
      })
    }

    const client = getClient()

    switch (req.method) {
      case 'DELETE': {
        try {
          // Unregister service
          const deleteResult = await client.unregisterService(serviceId)
          
          res.status(200).json({
            success: true,
            serviceId,
            ...deleteResult,
            timestamp: Date.now()
          })
        } catch (error) {
          console.error(`Failed to delete service ${serviceId}:`, error)
          res.status(500).json({ 
            error: 'Failed to delete service',
            serviceId,
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break
      }

      case 'PUT': {
        try {
          // Validate request body
          const { status } = req.body
          
          if (!status || typeof status !== 'string') {
            return res.status(400).json({ 
              error: 'Invalid status',
              details: 'Status must be a non-empty string',
              received: typeof status
            })
          }
          
          // Update service status
          const updateData: ServiceUpdate = { serviceId, status: status.trim() }
          const updateResult = await client.updateServiceStatus(updateData)
          
          res.status(200).json({
            success: true,
            serviceId,
            status: status.trim(),
            ...updateResult,
            timestamp: Date.now()
          })
        } catch (error) {
          console.error(`Failed to update service ${serviceId}:`, error)
          res.status(500).json({ 
            error: 'Failed to update service',
            serviceId,
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break
      }

      case 'GET': {
        try {
          // Get specific service info (if supported by the SDK)
          res.status(200).json({
            serviceId,
            message: 'Service ID received',
            timestamp: Date.now()
          })
        } catch (error) {
          console.error(`Failed to get service ${serviceId}:`, error)
          res.status(500).json({ 
            error: 'Failed to get service',
            serviceId,
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
        break
      }

      default:
        res.setHeader('Allow', ['GET', 'DELETE', 'PUT'])
        res.status(405).json({
          error: `Method ${req.method} Not Allowed`,
          allowedMethods: ['GET', 'DELETE', 'PUT']
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

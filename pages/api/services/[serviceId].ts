import type { NextApiRequest, NextApiResponse } from 'next'
import { WatchdogClient, type ServiceUpdate } from 'watchdog-grpc-sdk'

let watchdogClient: WatchdogClient | null = null

// Helper function to convert numeric type to SDK ServiceType
function convertToServiceType(numericType: number): number {
  // Return the numeric value directly since SDK expects numeric enum values
  // Valid values: 0-10 (UNSPECIFIED, HTTP, GRPC, DATABASE, CACHE, QUEUE, STORAGE, EXTERNAL_API, MICROSERVICE, OTHER, SYSTEMD)
  return (numericType >= 0 && numericType <= 10) ? numericType : 1 // Default to HTTP
}

function getClient() {
  if (!watchdogClient) {
    try {
      watchdogClient = new WatchdogClient({
        host: process.env.WATCHDOG_HOST || 'host.docker.internal',
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

// GET /api/services/[serviceId] - Get specific service info
async function handleGET(req: NextApiRequest, res: NextApiResponse, serviceId: string) {
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
}

// PUT /api/services/[serviceId] - Update service
async function handlePUT(req: NextApiRequest, res: NextApiResponse, serviceId: string) {
  try {
    const client = getClient()
    const updateData = req.body
    
    // Validate request body
    if (!updateData || typeof updateData !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body',
        details: 'Request body must be a valid JSON object'
      })
    }
    
  
      // Full service update using SDK's updateService method
      console.log('Full service update requested for:', serviceId)
      
      const serviceUpdate: ServiceUpdate = {
        serviceId,
        status: updateData.status || 'updated'
      }
      
      // Add optional fields if provided
      if (updateData.name) serviceUpdate.name = updateData.name
      if (updateData.endpoint) serviceUpdate.endpoint = updateData.endpoint
      if (updateData.type !== undefined) serviceUpdate.type = convertToServiceType(updateData.type)
      
      console.log('Calling updateService with:', serviceUpdate)
      const updateResult = await client.updateService(serviceUpdate)
      console.log('Service updated successfully:', updateResult)
      
      res.status(200).json({
        success: true,
        serviceId,
        updateType: 'full',
        operation: 'sdk_update',
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
}

// DELETE /api/services/[serviceId] - Delete service
async function handleDELETE(req: NextApiRequest, res: NextApiResponse, serviceId: string) {
  try {
    const client = getClient()
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

    switch (req.method) {
      case 'GET':
        return await handleGET(req, res, serviceId)
      case 'PUT':
        return await handlePUT(req, res, serviceId)
      case 'DELETE':
        return await handleDELETE(req, res, serviceId)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({
          error: `Method ${req.method} Not Allowed`,
          allowedMethods: ['GET', 'PUT', 'DELETE']
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

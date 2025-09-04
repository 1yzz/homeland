import { ServiceInfo } from '../stores/serviceStore'
import { SERVICE_TYPE_LABELS } from './serviceTypes'

// Helper functions to parse service data from various formats
export function parseServiceData(service: ServiceInfo) {
  // Try to use protobuf methods first (safest approach)
  if (service.getId && typeof service.getId === 'function') {
    return {
      id: service.getId() || '',
      name: service.getName?.() || 'Unknown Service',
      endpoint: service.getEndpoint?.() || 'Unknown Endpoint',
      status: service.getStatus?.() || 'unknown',
      timestamp: 0,
      type: service.getType?.() || 0,
    }
  }
  
  // Fallback to direct property access
  if (service.id || service.name || service.endpoint) {
    return {
      id: service.id || '',
      name: service.name || 'Unknown Service',
      endpoint: service.endpoint || 'Unknown Endpoint',
      status: service.status || 'unknown',
      timestamp: 0,
      type: service.type || 0,
    }
  }
  
  // Last resort: try to extract from any available data
  // This handles cases where the protobuf object has unexpected structure
  const fallbackData = {
    id: '',
    name: 'Unknown Service',
    endpoint: 'Unknown Endpoint',
    status: 'unknown',
    timestamp: 0,
    type: 0,
  }
  
  // Look for any properties that might contain the data
  for (const [key, value] of Object.entries(service)) {
    if (typeof value === 'string' && key.toLowerCase().includes('id')) {
      fallbackData.id = value
    } else if (typeof value === 'string' && key.toLowerCase().includes('name')) {
      fallbackData.name = value
    } else if (typeof value === 'string' && key.toLowerCase().includes('endpoint')) {
      fallbackData.endpoint = value
    } else if (typeof value === 'string' && key.toLowerCase().includes('status')) {
      fallbackData.status = value
    } else if (typeof value === 'number' && key.toLowerCase().includes('type')) {
      fallbackData.type = value
    }
  }
  
  return fallbackData
}

export function getServiceStatus(status: string): 'success' | 'warning' | 'error' {
  const normalizedStatus = status.toLowerCase()
  
  if (normalizedStatus === 'healthy' || normalizedStatus === 'active' || normalizedStatus === 'running') {
    return 'success'
  }
  
  if (normalizedStatus === 'warning' || normalizedStatus === 'degraded') {
    return 'warning'
  }
  
  return 'error' // unhealthy, error, failed, etc.
}

export function getServiceTypeLabel(type: number): string {
  return SERVICE_TYPE_LABELS[type as keyof typeof SERVICE_TYPE_LABELS] || 'Unknown'
}

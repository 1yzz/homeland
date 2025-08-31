import { create } from 'zustand'

export interface ServiceRegistration {
  name: string
  endpoint: string
  type: number
}

export interface ServiceInfo {
  // Protobuf methods (when available)
  getId?(): string
  getName?(): string
  getEndpoint?(): string
  getType?(): number
  getStatus?(): string
  
  // Standard object properties (when available)
  id?: string
  name?: string
  endpoint?: string
  type?: number
  status?: string
  
  // Allow any other properties that might be present in protobuf objects
  [key: string]: any
}

interface ServiceStore {
  services: ServiceInfo[]
  loading: boolean
  error: string | null
  apiBaseUrl: string
  
  // Actions
  setApiBaseUrl: (url: string) => void
  fetchServices: () => Promise<void>
  registerService: (data: ServiceRegistration) => Promise<void>
  unregisterService: (serviceId: string) => Promise<void>
  updateServiceStatus: (serviceId: string, status: string) => Promise<void>
  clearError: () => void
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  services: [],
  loading: false,
  error: null,
  apiBaseUrl: '/api',

  setApiBaseUrl: (url: string) => {
    set({ apiBaseUrl: url })
  },

  fetchServices: async () => {
    const { apiBaseUrl } = get()
    set({ loading: true, error: null })
    
    try {
      const response = await fetch(`${apiBaseUrl}/services`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      set({ services: data.services || [] })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ error: `Failed to fetch services: ${errorMessage}` })
    } finally {
      set({ loading: false })
    }
  },

  registerService: async (data: ServiceRegistration) => {
    const { apiBaseUrl } = get()
    set({ loading: true, error: null })
    
    try {
      const response = await fetch(`${apiBaseUrl}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }
      
      await get().fetchServices()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ error: `Failed to register service: ${errorMessage}` })
    } finally {
      set({ loading: false })
    }
  },

  unregisterService: async (serviceId: string) => {
    const { apiBaseUrl } = get()
    set({ loading: true, error: null })
    
    try {
      const response = await fetch(`${apiBaseUrl}/services/${serviceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }
      
      await get().fetchServices()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ error: `Failed to unregister service: ${errorMessage}` })
    } finally {
      set({ loading: false })
    }
  },

  updateServiceStatus: async (serviceId: string, status: string) => {
    const { apiBaseUrl } = get()
    set({ loading: true, error: null })
    
    try {
      const response = await fetch(`${apiBaseUrl}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }
      
      await get().fetchServices()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      set({ error: `Failed to update service status: ${errorMessage}` })
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

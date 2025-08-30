import { create } from 'zustand'
import { MockWatchdogClient, ServiceType, ServiceFormData } from '../lib/mockWatchdogClient'

interface ServiceStore {
  services: any[] | null
  loading: boolean
  error: string | null
  client: MockWatchdogClient | null
  
  // Actions
  initializeClient: (host: string, port: number) => void
  fetchServices: () => Promise<void>
  registerService: (data: ServiceFormData) => Promise<void>
  unregisterService: (serviceId: string) => Promise<void>
  updateServiceStatus: (serviceId: string, status: string) => Promise<void>
  clearError: () => void
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  services: null,
  loading: false,
  error: null,
  client: null,

  initializeClient: (host: string, port: number) => {
    try {
      const client = new MockWatchdogClient({
        host,
        port,
        timeout: 5000,
      })
      set({ client, error: null })
    } catch (error) {
      set({ error: `Failed to initialize client: ${error}` })
    }
  },

  fetchServices: async () => {
    const { client } = get()
    if (!client) {
      set({ error: 'Client not initialized' })
      return
    }

    set({ loading: true, error: null })
    try {
      const services = await client.listServices()
      set({ services, loading: false })
    } catch (error) {
      set({ error: `Failed to fetch services: ${error}`, loading: false })
    }
  },

  registerService: async (data: ServiceFormData) => {
    const { client } = get()
    if (!client) {
      set({ error: 'Client not initialized' })
      return
    }

    set({ loading: true, error: null })
    try {
      await client.registerService(data)
      // Refresh services after registration
      await get().fetchServices()
    } catch (error) {
      set({ error: `Failed to register service: ${error}`, loading: false })
    }
  },

  unregisterService: async (serviceId: string) => {
    const { client } = get()
    if (!client) {
      set({ error: 'Client not initialized' })
      return
    }

    set({ loading: true, error: null })
    try {
      await client.unregisterService(serviceId)
      // Refresh services after registration
      await get().fetchServices()
    } catch (error) {
      set({ error: `Failed to unregister service: ${error}`, loading: false })
    }
  },

  updateServiceStatus: async (serviceId: string, status: string) => {
    const { client } = get()
    if (!client) {
      set({ error: 'Client not initialized' })
      return
    }

    set({ loading: true, error: null })
    try {
      await client.updateServiceStatus({ serviceId, status })
      // Refresh services after status update
      await get().fetchServices()
    } catch (error) {
      set({ error: `Failed to update service status: ${error}`, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

import { create } from 'zustand'

interface SystemState {
  serverIP: string
  isLoading: boolean
  setServerIP: (ip: string) => void
  setIsLoading: (loading: boolean) => void
  fetchServerIP: () => Promise<void>
  replaceLocalhost: (url: string) => string
}

export const useSystemStore = create<SystemState>((set, get) => ({
    serverIP: 'localhost',
    isLoading: true,
  
  setServerIP: (ip: string) => set({ serverIP: ip }),
  
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  
  fetchServerIP: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/system/ip')
      if (response.ok) {
        const data = await response.json()
        set({ serverIP: data.ip || 'localhost' })
      } else {
        set({ serverIP: '获取失败' })
      }
    } catch (error) {
      console.error('获取服务器IP失败:', error)
      set({ serverIP: '获取失败' })
    } finally {
      set({ isLoading: false })
    }
  },
  
  replaceLocalhost: (url: string): string => {
    if (!url) return url
    
    const { serverIP } = get()
    if (serverIP === 'localhost' || serverIP === '获取失败' || serverIP === '加载中...') {
      return url
    }
    
    // 替换localhost和127.0.0.1为服务器IP
    return url
      .replace(/localhost/g, serverIP)
      .replace(/127\.0\.0\.1/g, serverIP)
  },

}))
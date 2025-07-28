import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SystemState {
  // IP地址相关
  localIP: string
  isLoadingIP: boolean
  ipError: string | null
  
  // 系统设置
  autoReplaceLocalhost: boolean
  
  // Actions
  setLocalIP: (ip: string) => void
  setLoadingIP: (loading: boolean) => void
  setIPError: (error: string | null) => void
  fetchLocalIP: () => Promise<void>
  setAutoReplaceLocalhost: (enabled: boolean) => void
  
  // 工具函数
  replaceLocalhostWithIP: (url: string) => string
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set, get) => ({
      // 初始状态
      localIP: '',
      isLoadingIP: false,
      ipError: null,
      autoReplaceLocalhost: true,
      
      // Actions
      setLocalIP: (ip: string) => set({ localIP: ip, ipError: null }),
      setLoadingIP: (loading: boolean) => set({ isLoadingIP: loading }),
      setIPError: (error: string | null) => set({ ipError: error }),
      setAutoReplaceLocalhost: (enabled: boolean) => set({ autoReplaceLocalhost: enabled }),
      
      // 获取本地IP
      fetchLocalIP: async () => {
        const { setLoadingIP, setLocalIP, setIPError } = get()
        
        setLoadingIP(true)
        setIPError(null)
        
        try {
          const response = await fetch('/api/system/ip')
          if (response.ok) {
            const data = await response.json()
            setLocalIP(data.ip)
          } else {
            setIPError('获取IP地址失败')
          }
        } catch (error) {
          setIPError('网络连接失败')
        } finally {
          setLoadingIP(false)
        }
      },
      
      // 替换localhost为实际IP
      replaceLocalhostWithIP: (url: string) => {
        const { localIP, autoReplaceLocalhost } = get()
        
        if (!autoReplaceLocalhost || !localIP || localIP === '未知') {
          return url
        }
        
        // 替换各种localhost格式
        return url
          .replace(/^http:\/\/localhost:/, `http://${localIP}:`)
          .replace(/^https:\/\/localhost:/, `https://${localIP}:`)
          .replace(/^http:\/\/127\.0\.0\.1:/, `http://${localIP}:`)
          .replace(/^https:\/\/127\.0\.0\.1:/, `https://${localIP}:`)
          .replace(/^localhost:/, `${localIP}:`)
          .replace(/^127\.0\.0\.1:/, `${localIP}:`)
      }
    }),
    {
      name: 'homeland-system-store', // localStorage key
      partialize: (state) => ({
        localIP: state.localIP,
        autoReplaceLocalhost: state.autoReplaceLocalhost
      })
    }
  )
) 
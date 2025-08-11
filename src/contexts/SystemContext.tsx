'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SystemContextType {
  serverIP: string
  isLoading: boolean
  replaceLocalhost: (url: string) => string
}

const SystemContext = createContext<SystemContextType | undefined>(undefined)

interface SystemProviderProps {
  children: ReactNode
}

export function SystemProvider({ children }: SystemProviderProps) {
  const [serverIP, setServerIP] = useState<string>('localhost')
  const [isLoading, setIsLoading] = useState(true)

  // 获取服务器IP地址
  useEffect(() => {
    const fetchServerIP = async () => {
      try {
        const response = await fetch('/api/system/ip')
        if (response.ok) {
          const data = await response.json()
          setServerIP(data.ip || 'localhost')
        }
      } catch (error) {
        console.error('获取服务器IP失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchServerIP()
  }, [])

  // 将localhost替换为服务器IP的函数
  const replaceLocalhost = (url: string): string => {
    if (!url) return url
    
    // 替换localhost和127.0.0.1为服务器IP
    return url
      .replace(/localhost/g, serverIP)
      .replace(/127\.0\.0\.1/g, serverIP)
  }

  const value: SystemContextType = {
    serverIP,
    isLoading,
    replaceLocalhost,
  }

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  )
}

export function useSystem() {
  const context = useContext(SystemContext)
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider')
  }
  return context
}
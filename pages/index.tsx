import React, { useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Dashboard from '../components/Dashboard'
import { useSystemStore } from '../stores/systemStore'
import { getSystemInfo } from '../utils/serverUtils'

interface HomeProps {
  systemData: {
    serverIP: string
    hostname: string
    timestamp: number
  }
}

export default function Home({ systemData }: HomeProps) {
  const { setServerIP, setIsLoading } = useSystemStore()

  // 使用 setServerIP 直接设置服务器 IP
  useEffect(() => {
    setServerIP(systemData.serverIP)
    setIsLoading(false)
  }, [setServerIP, setIsLoading, systemData.serverIP])

  return <Dashboard />
}

// Server-side rendering: Fetch server IP using Node.js
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const systemData = getSystemInfo()
    
    return {
      props: {
        systemData,
      },
    }
  } catch (error) {
    console.error('Failed to get system info during SSR:', error)
    
    // Return fallback data if SSR fails
    return {
      props: {
        systemData: {
          serverIP: 'localhost',
          hostname: 'unknown',
          timestamp: Date.now(),
        },
      },
    }
  }
}

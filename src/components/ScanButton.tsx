'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScanButton() {
  const [isScanning, setIsScanning] = useState(false)
  const router = useRouter()

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const response = await fetch('/api/services/scan', {
        method: 'POST',
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('扫描完成:', result)
        // 刷新页面显示更新的服务
        router.refresh()
      } else {
        console.error('扫描失败')
      }
    } catch (error) {
      console.error('扫描过程中出错:', error)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <button
      onClick={handleScan}
      disabled={isScanning}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isScanning ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          扫描中...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          扫描服务
        </>
      )}
    </button>
  )
}
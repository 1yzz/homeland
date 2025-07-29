'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientSSEHandler() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔌 ClientSSEHandler: Initializing SSE connection...');
    
    // 检查浏览器是否支持SSE
    if (typeof EventSource === 'undefined') {
      console.error('❌ EventSource not supported by this browser');
      return;
    }
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/sse');
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 SSE message received:', data);
            
            if (data.type === 'service_status_update') {
              console.log('🔄 Service status updated, refreshing page...');
              router.refresh(); // 触发SSR重新渲染
            } else if (data.type === 'heartbeat') {
              console.log('💓 Heartbeat received');
            } else if (data.type === 'connected') {
              console.log('✅ SSE connection confirmed by server');
            } else {
              console.log('❓ Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ SSE error:', error);
          console.log('SSE readyState:', eventSource?.readyState);
          eventSource?.close();
          
          // 5秒后重新连接
          reconnectTimeout = setTimeout(() => {
            console.log('🔄 Reconnecting SSE...');
            connectSSE();
          }, 5000);
        };

        eventSource.onopen = () => {
          console.log('✅ SSE connection established');
        };

      } catch (error) {
        console.error('❌ Failed to establish SSE connection:', error);
      }
    };

    // 延迟连接以确保组件完全挂载
    const initTimeout = setTimeout(() => {
      connectSSE();
    }, 1000);

    return () => {
      console.log('🔌 ClientSSEHandler unmounting, cleaning up...');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (eventSource) {
        eventSource.close();
        console.log('🔌 SSE connection closed');
      }
    };
  }, [router]);

  return null; // 这个组件不渲染任何内容，只处理SSE
} 
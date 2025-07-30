import { NextRequest } from 'next/server';
import { connections } from '@/lib/sse';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // 添加到连接集合
      connections.add(controller);
      console.log(`📡 New SSE connection established. Total connections: ${connections.size}`);
      
      // 发送初始连接确认
      const welcome = `data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`;
      controller.enqueue(new TextEncoder().encode(welcome));
      
      // 设置保活心跳
      const keepAlive = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          clearInterval(keepAlive);
          connections.delete(controller);
        }
      }, 30000); // 30秒心跳
      
      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        connections.delete(controller);
        console.log(`📡 SSE connection closed. Remaining connections: ${connections.size}`);
        try {
          controller.close();
        } catch {
          // Connection already closed
        }
      });
    },
    
    cancel() {
      // 连接关闭时清理
      connections.delete(this as ReadableStreamDefaultController);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    },
  });
} 
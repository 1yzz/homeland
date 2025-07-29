import { NextRequest } from 'next/server';

// 使用全局变量来存储连接，避免热重载时重置
declare global {
  var sseConnections: Set<ReadableStreamDefaultController> | undefined;
}

// 存储所有活跃的连接
const connections = globalThis.sseConnections || new Set<ReadableStreamDefaultController>();
if (!globalThis.sseConnections) {
  globalThis.sseConnections = connections;
}

// 广播消息给所有连接的客户端
export function broadcastUpdate(data: { type: string; timestamp?: string; message?: string }) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  console.log(`📡 Broadcasting to ${connections.size} SSE connections:`, data);
  console.log(`🔍 Connections Set:`, connections);
  console.log(`🔍 Global connections:`, globalThis.sseConnections);
  
  if (connections.size === 0) {
    console.log('⚠️ No SSE connections available for broadcast');
    return;
  }
  
  const deadConnections = new Set<ReadableStreamDefaultController>();
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // 如果连接已关闭，标记为要删除
      deadConnections.add(controller);
      console.log('🔌 Found dead SSE connection');
    }
  });
  
  // 清理死连接
  deadConnections.forEach(controller => {
    connections.delete(controller);
  });
  
  if (deadConnections.size > 0) {
    console.log(`🧹 Cleaned up ${deadConnections.size} dead connections. Active: ${connections.size}`);
  }
}

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
        } catch (error) {
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
        } catch (error) {
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
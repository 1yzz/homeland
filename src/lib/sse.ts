// SSE (Server-Sent Events) utility functions

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
    } catch {
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

export { connections }; 
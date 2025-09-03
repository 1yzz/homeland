import { networkInterfaces } from 'os'

/**
 * Get the server's IP address on the server side
 */
export function getServerIP(): string {
  const interfaces = networkInterfaces()
  
  // Priority order: eth0, en0, wlan0, then any other interface
  const priorityInterfaces = ['eth0', 'en0', 'wlan0']
  
  // First, try priority interfaces
  for (const interfaceName of priorityInterfaces) {
    const networkInterface = interfaces[interfaceName]
    if (networkInterface) {
      for (const net of networkInterface) {
        // Skip internal (loopback) addresses and IPv6
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
  }
  
  // If no priority interface found, check all interfaces
  for (const interfaceName of Object.keys(interfaces)) {
    const networkInterface = interfaces[interfaceName]
    if (networkInterface) {
      for (const net of networkInterface) {
        // Skip internal (loopback) addresses and IPv6
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
  }
  
  // Fallback to localhost if no external IP found
  return 'localhost'
}

/**
 * Get system information for SSR
 */
export function getSystemInfo() {
  return {
    serverIP: getServerIP(),
    hostname: process.env.HOSTNAME || 'unknown',
    timestamp: Date.now(),
  }
}

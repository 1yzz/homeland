import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // 尝试多种方式获取本地IP
    const commands = [
      "ip route get 1.1.1.1 | awk '{print $7; exit}'",
      "hostname -I | awk '{print $1}'",
      "ifconfig | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}'"
    ]
    
    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command)
        const ip = stdout.trim()
        if (ip && ip !== '127.0.0.1' && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          return NextResponse.json({ ip })
        }
      } catch {
        continue
        }
      }
    
    // 如果所有方法都失败，返回localhost
    return NextResponse.json({ ip: 'localhost' })
  } catch (error) {
    console.error('获取IP地址失败:', error)
    return NextResponse.json(
      { ip: 'localhost' },
      { status: 500 }
    )
  }
} 
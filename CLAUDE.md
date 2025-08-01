# CLAUDE.md

- This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- use Simplified Chinese to chat with me and comment on the code

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations
npx prisma generate          # Generate Prisma client after schema changes
npx prisma db push          # Push schema changes to database
npx prisma migrate dev      # Create and apply new migration
npx prisma studio          # Open Prisma Studio for database inspection
```

## Architecture Overview

**Homeland** is a Next.js service monitoring dashboard that discovers and tracks running services on a local machine. The application uses a server-side architecture with real-time service discovery capabilities.

### Core Components

**Service Discovery Engine** (`src/lib/serviceDiscovery.ts`):
- Scans common ports (3000, 3001, 8000, 8080, etc.) using `netstat`
- Detects service types by analyzing HTTP responses (frontend, API, web-server)
- Discovers Docker containers with exposed ports via `docker ps`
- Returns structured service data with port, type, status, and URL information

**Database Layer** (`src/lib/db.ts`, `prisma/schema.prisma`):
- Uses Prisma ORM with MySQL backend
- Service model supports service types (WEBSERVICE, BACKEND, SYSTEMD, DOCKER, etc.)
- Tracks service status (RUNNING, STOPPED, ERROR, STARTING, STOPPING)
- Stores service metadata including commands, working directories, and environment variables

**API Routes**:
- `GET /api/services` - Returns all services from database (no auto-scanning)
- `POST /api/services/scan` - Triggers service discovery scan only (returns discoverable services)
- `POST /api/admin/services` - Creates new service entry (unified endpoint with auto health check)

**Frontend Components**:
- `ServiceCard` - Displays individual service with status indicators and "Visit Service" links
- `ScanButton` - Client-side component that triggers service discovery via API

### Service Discovery Flow

1. User clicks "Scan Services" → triggers `/api/services/scan`
2. `scanRunningServices()` executes system commands to detect services
3. User selects services to add → created via `/api/admin/services` endpoint with automatic health check configuration
4. Main page displays services from database with real-time status

### Database Schema Notes

The `Service` model replaced the original `Website` model and includes:
- Service management fields (command, workingDir, envVars, autoStart)
- Enum types for consistent service categorization
- JSON field for flexible environment variable storage

### Key Dependencies

- **Prisma**: Database ORM and schema management
- **MySQL**: Primary database
- **Next.js 15**: App Router with server components
- **Tailwind CSS**: Styling with dark mode support
- **TypeScript**: Full type safety

## Issues and Troubleshooting

### Database Connection Errors

- **Error**: Can't reach database server at `localhost:3306`
  - Possible reasons:
    - MySQL service not running
    - Incorrect database configuration
    - Network/port issues preventing connection
  - Troubleshooting steps:
    - Verify MySQL service is started: `sudo systemctl status mysql`
    - Check database credentials in `.env` file
    - Ensure `localhost:3306` is accessible
    - Restart MySQL service if needed

### Build and Deployment Issues

- Docker构建过程出错，可能是网络模式问题
  - 错误信息显示无法连接数据库服务器 `localhost:3306`
  - 问题可能与容器网络配置相关，特别是数据库服务器连接
  - 建议检查Docker网络设置，确保容器可以正确访问本地MySQL服务器
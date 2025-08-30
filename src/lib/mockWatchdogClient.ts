// Mock Watchdog Client for development and testing
export enum ServiceType {
  SERVICE_TYPE_UNSPECIFIED = 0,
  SERVICE_TYPE_HTTP = 1,
  SERVICE_TYPE_GRPC = 2,
  SERVICE_TYPE_DATABASE = 3,
  SERVICE_TYPE_CACHE = 4,
  SERVICE_TYPE_QUEUE = 5,
  SERVICE_TYPE_STORAGE = 6,
  SERVICE_TYPE_EXTERNAL_API = 7,
  SERVICE_TYPE_MICROSERVICE = 8,
  SERVICE_TYPE_OTHER = 9,
}

export interface ServiceInfo {
  getId(): string
  getName(): string
  getEndpoint(): string
  getType(): ServiceType
  getStatus(): string
}

export interface ServiceFormData {
  name: string
  endpoint: string
  type: ServiceType
}

export interface HealthResponse {
  status: string
  message: string
}

export interface RegisterServiceResponse {
  serviceId: string
  message: string
}

export interface UnregisterServiceResponse {
  message: string
}

export interface UpdateStatusResponse {
  message: string
}

class MockServiceInfo implements ServiceInfo {
  constructor(
    private id: string,
    private name: string,
    private endpoint: string,
    private type: ServiceType,
    private status: string
  ) {}

  getId(): string { return this.id }
  getName(): string { return this.name }
  getEndpoint(): string { return this.endpoint }
  getType(): ServiceType { return this.type }
  getStatus(): string { return this.status }
}

export class MockWatchdogClient {
  private services: Map<string, MockServiceInfo> = new Map()
  private nextId = 1

  constructor(private options: { host: string; port: number; timeout?: number }) {
    // Initialize with some mock data
    this.services.set('1', new MockServiceInfo(
      '1',
      'Mock HTTP Service',
      'http://localhost:8080',
      ServiceType.SERVICE_TYPE_HTTP,
      'healthy'
    ))
    this.services.set('2', new MockServiceInfo(
      '2',
      'Mock gRPC Service',
      'grpc://localhost:9090',
      ServiceType.SERVICE_TYPE_GRPC,
      'healthy'
    ))
    this.services.set('3', new MockServiceInfo(
      '3',
      'Mock Database',
      'mysql://localhost:3306',
      ServiceType.SERVICE_TYPE_DATABASE,
      'warning'
    ))
  }

  async getHealth(): Promise<HealthResponse> {
    await this.delay(100)
    return { status: 'healthy', message: 'Mock server is running' }
  }

  async registerService(data: ServiceFormData): Promise<RegisterServiceResponse> {
    await this.delay(200)
    const id = (this.nextId++).toString()
    const service = new MockServiceInfo(
      id,
      data.name,
      data.endpoint,
      data.type,
      'healthy'
    )
    this.services.set(id, service)
    return { serviceId: id, message: 'Service registered successfully' }
  }

  async unregisterService(serviceId: string): Promise<UnregisterServiceResponse> {
    await this.delay(150)
    this.services.delete(serviceId)
    return { message: 'Service unregistered successfully' }
  }

  async listServices(): Promise<ServiceInfo[]> {
    await this.delay(100)
    return Array.from(this.services.values())
  }

  async updateServiceStatus(update: { serviceId: string; status: string }): Promise<UpdateStatusResponse> {
    await this.delay(100)
    const service = this.services.get(update.serviceId)
    if (service) {
      // Create a new service with updated status
      const updatedService = new MockServiceInfo(
        service.getId(),
        service.getName(),
        service.getEndpoint(),
        service.getType(),
        update.status
      )
      this.services.set(update.serviceId, updatedService)
    }
    return { message: 'Service status updated successfully' }
  }

  close(): void {
    // Mock implementation - nothing to close
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

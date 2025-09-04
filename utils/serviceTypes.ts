// Service types that mirror the watchdog-grpc-sdk ServiceType enum
// These values must match proto.watchdog.ServiceType from the SDK
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
  SERVICE_TYPE_SYSTEMD = 10,
}

// Service type labels for UI display
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.SERVICE_TYPE_UNSPECIFIED]: 'Unspecified',
  [ServiceType.SERVICE_TYPE_HTTP]: 'HTTP',
  [ServiceType.SERVICE_TYPE_GRPC]: 'gRPC',
  [ServiceType.SERVICE_TYPE_DATABASE]: 'Database',
  [ServiceType.SERVICE_TYPE_CACHE]: 'Cache',
  [ServiceType.SERVICE_TYPE_QUEUE]: 'Queue',
  [ServiceType.SERVICE_TYPE_STORAGE]: 'Storage',
  [ServiceType.SERVICE_TYPE_EXTERNAL_API]: 'External API',
  [ServiceType.SERVICE_TYPE_MICROSERVICE]: 'Microservice',
  [ServiceType.SERVICE_TYPE_OTHER]: 'Other',
  [ServiceType.SERVICE_TYPE_SYSTEMD]: 'Systemd',
}

// Service type options for form dropdowns
export const SERVICE_TYPE_OPTIONS = [
  { value: ServiceType.SERVICE_TYPE_HTTP, label: 'HTTP Service' },
  { value: ServiceType.SERVICE_TYPE_GRPC, label: 'gRPC Service' },
  { value: ServiceType.SERVICE_TYPE_DATABASE, label: 'Database' },
  { value: ServiceType.SERVICE_TYPE_CACHE, label: 'Cache' },
  { value: ServiceType.SERVICE_TYPE_QUEUE, label: 'Queue' },
  { value: ServiceType.SERVICE_TYPE_STORAGE, label: 'Storage' },
  { value: ServiceType.SERVICE_TYPE_EXTERNAL_API, label: 'External API' },
  { value: ServiceType.SERVICE_TYPE_MICROSERVICE, label: 'Microservice' },
  { value: ServiceType.SERVICE_TYPE_SYSTEMD, label: 'Systemd Service' },
  { value: ServiceType.SERVICE_TYPE_OTHER, label: 'Other' },
]

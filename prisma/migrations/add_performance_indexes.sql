-- 优化服务查询性能的索引
-- 为服务表添加复合索引
CREATE INDEX IF NOT EXISTS idx_service_status_name ON Service(status, name);
CREATE INDEX IF NOT EXISTS idx_service_last_checked ON Service(lastChecked DESC);
CREATE INDEX IF NOT EXISTS idx_service_created_at ON Service(createdAt DESC);

-- 为健康检查配置表添加索引
CREATE INDEX IF NOT EXISTS idx_health_config_service_enabled ON HealthCheckConfig(serviceId, enabled);

-- 为健康检查结果表添加索引
CREATE INDEX IF NOT EXISTS idx_health_result_service_checked ON HealthCheckResult(serviceId, lastChecked DESC);
CREATE INDEX IF NOT EXISTS idx_health_result_last_checked ON HealthCheckResult(lastChecked DESC);
CREATE INDEX IF NOT EXISTS idx_health_result_status ON HealthCheckResult(status);

-- 为服务名称添加唯一索引（如果还没有的话）
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_name_unique ON Service(name); 
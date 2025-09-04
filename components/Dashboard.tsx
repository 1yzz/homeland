import React, { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Button,
  Paper,
  Divider,
  LinearProgress,
} from '@mui/material'
import {
  Monitor,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Launch,
  Update,
  Security,
  Speed,
} from '@mui/icons-material'
import { useServiceStore } from '../stores/serviceStore'
import { useSystemStore } from '../stores/systemStore'
import Header from './Header'
import { parseServiceData, getServiceStatus } from '../utils/serviceUtils'

const Dashboard: React.FC = () => {
  const { services, fetchServices, loading } = useServiceStore()
  const { replaceLocalhost, serverIP } = useSystemStore()
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    unhealthy: 0,
    warning: 0,
  })

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  useEffect(() => {
    if (services) {
      const total = services.length
      const healthy = services.filter(s => {
        const { status } = parseServiceData(s)
        return getServiceStatus(status) === 'success'
      }).length
      const unhealthy = services.filter(s => {
        const { status } = parseServiceData(s)
        return getServiceStatus(status) === 'error'
      }).length
      const warning = services.filter(s => {
        const { status } = parseServiceData(s)
        return getServiceStatus(status) === 'warning'
      }).length

      setStats({ total, healthy, unhealthy, warning })
    }
  }, [services])

  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ReactNode
    color: string
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Header />
      <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Service Management Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor and manage your services with Watchdog SDK v1.0.7
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">
              Server: {serverIP}
            </Typography>
            <Chip 
              icon={<Update />} 
              label="SDK v1.0.7" 
              size="small" 
              color="success" 
              variant="outlined"
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchServices}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* SDK Update Notice */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Update sx={{ mr: 1 }} />
              Watchdog SDK Updated to v1.0.7
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Enhanced service registration, improved error handling, and better type support including systemd services.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Chip icon={<Security />} label="Enhanced Security" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip icon={<Speed />} label="Better Performance" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Services"
            value={stats.total}
            icon={<Monitor />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Healthy"
            value={stats.healthy}
            icon={<CheckCircle />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Warning"
            value={stats.warning}
            icon={<Warning />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unhealthy"
            value={stats.unhealthy}
            icon={<Error />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      {/* Services Overview */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" component="h2">
              Service Overview
            </Typography>
            {stats.total > 0 && (
              <Box sx={{ minWidth: 200 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Health Score
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((stats.healthy / stats.total) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(stats.healthy / stats.total) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>
          
          {services && services.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {services.slice(0, 6).map((service, index) => {
                  const { id, name, endpoint, status } = parseServiceData(service)
                  const serviceId = id || `service-${index}`
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={serviceId}>
                      <Card variant="outlined" sx={{ 
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                              {name}
                            </Typography>
                            {endpoint && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const finalUrl = replaceLocalhost(endpoint)
                                  window.open(finalUrl, '_blank', 'noopener,noreferrer')
                                }}
                                title={`Open ${endpoint}`}
                                sx={{ ml: 1 }}
                              >
                                <Launch fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
                            {endpoint}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip
                              label={status}
                              color={getServiceStatus(status)}
                              size="small"
                              sx={{ fontWeight: 'medium' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              ID: {serviceId}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
              
              {services.length > 6 && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Showing 6 of {services.length} services
                  </Typography>
                  <Button 
                    variant="text" 
                    sx={{ mt: 1 }}
                    onClick={() => window.location.href = '/services'}
                  >
                    View All Services
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Monitor sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Services Registered
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by registering your first service to monitor its health and status.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => window.location.href = '/services'}
                startIcon={<Monitor />}
              >
                Add First Service
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

export default Dashboard

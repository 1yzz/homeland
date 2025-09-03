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
} from '@mui/material'
import {
  Monitor,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Launch,
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">
              Server IP: {serverIP}
            </Typography>
          </Box>
          <Chip
            icon={<Refresh />}
            label="Refresh"
            onClick={fetchServices}
            clickable
          />
        </Box>
      </Box>

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

      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Recent Services
          </Typography>
          {services && services.length > 0 ? (
            <Grid container spacing={2}>
              {services.slice(0, 6).map((service, index) => {
                const { id, name, endpoint, status } = parseServiceData(service)
                const serviceId = id || `service-${index}`
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={serviceId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" component="div">
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
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {endpoint}
                        </Typography>
                        <Chip
                          label={status}
                          color={getServiceStatus(status)}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          ) : (
            <Typography color="text.secondary">
              No services registered yet.
            </Typography>
          )}
        </CardContent>
      </Card>
      </Box>
    </>
  )
}

export default Dashboard

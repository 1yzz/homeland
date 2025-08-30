import React, { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  Monitor,
  CheckCircle,
  Error,
  Warning,
  Refresh,
} from '@mui/icons-material'
import { useServiceStore } from '../stores/serviceStore'

const Dashboard: React.FC = () => {
  const { services, fetchServices, loading } = useServiceStore()
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
      const healthy = services.filter(s => s.getStatus() === 'healthy').length
      const unhealthy = services.filter(s => s.getStatus() === 'unhealthy').length
      const warning = services.filter(s => s.getStatus() === 'warning').length

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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Chip
          icon={<Refresh />}
          label="Refresh"
          onClick={fetchServices}
          clickable
        />
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
              {services.slice(0, 6).map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.getId()}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" component="div">
                        {service.getName()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.getEndpoint()}
                      </Typography>
                      <Chip
                        label={service.getStatus()}
                        color={
                          service.getStatus() === 'healthy'
                            ? 'success'
                            : service.getStatus() === 'warning'
                            ? 'warning'
                            : 'error'
                        }
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">
              No services registered yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default Dashboard

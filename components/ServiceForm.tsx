import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Alert,
} from '@mui/material'
import { useServiceStore, type ServiceRegistration } from '../stores/serviceStore'

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

interface ServiceFormProps {
  open: boolean
  onClose: () => void
  service?: {
    id: string
    name: string
    endpoint: string
    type: number
    status: string
  } | null
}

const ServiceForm: React.FC<ServiceFormProps> = ({ open, onClose, service }) => {
  const { registerService, loading, error, clearError } = useServiceStore()
  const [formData, setFormData] = useState<ServiceRegistration>({
    name: '',
    endpoint: '',
    type: ServiceType.SERVICE_TYPE_HTTP,
  })

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        endpoint: service.endpoint || '',
        type: service.type || ServiceType.SERVICE_TYPE_HTTP,
      })
    } else {
      setFormData({
        name: '',
        endpoint: '',
        type: ServiceType.SERVICE_TYPE_HTTP,
      })
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerService(formData)
      onClose()
    } catch (error) {
      // Error is handled by the store
    }
  }

  const handleClose = () => {
    clearError()
    onClose()
  }

  const serviceTypeOptions = [
    { value: ServiceType.SERVICE_TYPE_HTTP, label: 'HTTP Service' },
    { value: ServiceType.SERVICE_TYPE_GRPC, label: 'gRPC Service' },
    { value: ServiceType.SERVICE_TYPE_DATABASE, label: 'Database' },
    { value: ServiceType.SERVICE_TYPE_CACHE, label: 'Cache' },
    { value: ServiceType.SERVICE_TYPE_QUEUE, label: 'Queue' },
    { value: ServiceType.SERVICE_TYPE_STORAGE, label: 'Storage' },
    { value: ServiceType.SERVICE_TYPE_EXTERNAL_API, label: 'External API' },
    { value: ServiceType.SERVICE_TYPE_MICROSERVICE, label: 'Microservice' },
    { value: ServiceType.SERVICE_TYPE_OTHER, label: 'Other' },
  ]

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {service ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="Service Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Endpoint"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
              required
              placeholder="http://localhost:8080 or grpc://localhost:9090"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={formData.type}
                label="Service Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ServiceType })}
              >
                {serviceTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name || !formData.endpoint}
          >
            {loading ? 'Saving...' : service ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ServiceForm

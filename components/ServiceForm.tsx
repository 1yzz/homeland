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
import { ServiceType, SERVICE_TYPE_OPTIONS } from '../utils/serviceTypes'

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
  const { registerService, updateService, loading, error, clearError } = useServiceStore()
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
        type: (service.type as ServiceType) || ServiceType.SERVICE_TYPE_HTTP,
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
      if (service?.id) {
        // 编辑模式：检查是否有重要变更
        const hasSignificantChanges = 
          service.name !== formData.name || 
          service.endpoint !== formData.endpoint || 
          service.type !== formData.type
        
        if (hasSignificantChanges) {
          // 如果有重要变更，使用删除+创建的方式
          console.log('Significant changes detected, updating service:', service.id)
          await updateService(service.id, formData)
          console.log('Service updated successfully')
        } else {
          // 如果没有变更，直接关闭
          console.log('No changes detected, closing form')
          onClose()
          return
        }
      } else {
        // 创建模式：直接注册新服务
        console.log('Creating new service')
        await registerService(formData)
        console.log('Service created successfully')
      }
      onClose()
    } catch (error) {
      // Error is handled by the store
      console.error('Service operation failed:', error)
    }
  }

  const handleClose = () => {
    clearError()
    onClose()
  }


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
                {SERVICE_TYPE_OPTIONS.map((option) => (
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
            {loading ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default ServiceForm

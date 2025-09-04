import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Settings,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'
import { useServiceStore } from '../stores/serviceStore'
import Header from './Header'
import { parseServiceData, getServiceTypeLabel } from '../utils/serviceUtils'
import ServiceForm from './ServiceForm'

const ServiceManager: React.FC = () => {
  const {
    services,
    loading,
    error,
    fetchServices,
    unregisterService,
    clearError,
    setApiBaseUrl,
  } = useServiceStore()

  const [openForm, setOpenForm] = useState(false)
  const [editingService, setEditingService] = useState<{
    id: string
    name: string
    endpoint: string
    type: number
    status: string
  } | null>(null)
  const [openSettings, setOpenSettings] = useState(false)
  const [apiConfig, setApiConfig] = useState({
    baseUrl: '/api',
  })

  useEffect(() => {
    // Set API base URL and fetch services
    setApiBaseUrl(apiConfig.baseUrl)
    fetchServices()
  }, [setApiBaseUrl, fetchServices, apiConfig.baseUrl])

  const handleAddService = () => {
    setEditingService(null)
    setOpenForm(true)
  }

  const handleEditService = (service: {
    id: string
    name: string
    endpoint: string
    type: number
    status: string
  }) => {
    setEditingService(service)
    setOpenForm(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await unregisterService(serviceId)
    }
  }

  const handleFormClose = () => {
    setOpenForm(false)
    setEditingService(null)
  }

  const handleSettingsSave = () => {
    setApiBaseUrl(apiConfig.baseUrl)
    fetchServices()
    setOpenSettings(false)
  }

  // Transform services to grid rows using helper function
  const rows = services.map((service, index) => {
    const parsedService = parseServiceData(service)
    return {
      id: parsedService.id || `service-${index}`,
      name: parsedService.name,
      endpoint: parsedService.endpoint,
      type: parsedService.type,
      status: parsedService.status,
    }
  })

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 80 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'endpoint', headerName: 'Endpoint', flex: 2, minWidth: 200 },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={getServiceTypeLabel(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'healthy'
              ? 'success'
              : params.value === 'warning'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => handleEditService(params.row)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteService(params.row.id)}
        />,
      ],
    },
  ]



  return (
    <>
      <Header />
      <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Service Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Settings">
            <IconButton onClick={() => setOpenSettings(true)}>
              <Settings />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchServices}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddService}
          >
            Add Service
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          disableRowSelectionOnClick
          sx={{ width: '100%' }}
        />
      </Box>

      {/* Service Form Dialog */}
      <ServiceForm
        open={openForm}
        onClose={handleFormClose}
        service={editingService}
      />

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={() => setOpenSettings(false)}>
        <DialogTitle>API Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="API Base URL"
            type="text"
            fullWidth
            variant="outlined"
            value={apiConfig.baseUrl}
            onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
                          placeholder="/api"
            helperText="Base URL for the API server that handles gRPC communication"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Cancel</Button>
          <Button onClick={handleSettingsSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </>
  )
}

export default ServiceManager

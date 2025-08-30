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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Settings,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'
import { ServiceType } from '../lib/mockWatchdogClient'
import { useServiceStore, ServiceFormData } from '../stores/serviceStore'
import ServiceForm from './ServiceForm'

const ServiceManager: React.FC = () => {
  const {
    services,
    loading,
    error,
    fetchServices,
    unregisterService,
    clearError,
    initializeClient,
  } = useServiceStore()

  const [openForm, setOpenForm] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [openSettings, setOpenSettings] = useState(false)
  const [clientConfig, setClientConfig] = useState({
    host: 'localhost',
    port: 50051,
  })

  useEffect(() => {
    // Initialize client on component mount
    initializeClient(clientConfig.host, clientConfig.port)
    fetchServices()
  }, [initializeClient, fetchServices])

  const handleAddService = () => {
    setEditingService(null)
    setOpenForm(true)
  }

  const handleEditService = (service: any) => {
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
    initializeClient(clientConfig.host, clientConfig.port)
    fetchServices()
    setOpenSettings(false)
  }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'endpoint', headerName: 'Endpoint', width: 300 },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={ServiceType[params.value]}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
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
      width: 120,
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

  const transformedServices = services?.map((service) => ({
    id: service.getId(),
    name: service.getName(),
    endpoint: service.getEndpoint(),
    type: service.getType(),
    status: service.getStatus(),
  })) || []

  return (
    <Box>
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
          rows={transformedServices}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 25 },
            },
          }}
          disableRowSelectionOnClick
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
        <DialogTitle>Client Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Host"
            type="text"
            fullWidth
            variant="outlined"
            value={clientConfig.host}
            onChange={(e) => setClientConfig({ ...clientConfig, host: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Port"
            type="number"
            fullWidth
            variant="outlined"
            value={clientConfig.port}
            onChange={(e) => setClientConfig({ ...clientConfig, port: parseInt(e.target.value) })}
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
  )
}

export default ServiceManager

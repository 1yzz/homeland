module.exports = {
  apps: [
    {
      name: 'homeland',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/homeland',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/homeland/error.log',
      out_file: '/var/log/homeland/out.log',
      log_file: '/var/log/homeland/combined.log',
      time: true
    }
  ]
} 
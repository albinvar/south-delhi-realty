module.exports = {
  apps: [
    {
      name: 'south-delhi-real-estate',
      script: './server/index.js',
      cwd: '/var/www/south-delhi-real-estate/dist',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: '/var/log/pm2/south-delhi-real-estate.log',
      out_file: '/var/log/pm2/south-delhi-real-estate-out.log',
      error_file: '/var/log/pm2/south-delhi-real-estate-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart settings
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      
      // Advanced settings
      node_args: '--max-old-space-size=512',
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful start/shutdown
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: ['YOUR_DIGITALOCEAN_DROPLET_IP'],
      ref: 'origin/main',
      repo: 'https://github.com/YOUR_USERNAME/south-delhi-real-estate.git',
      path: '/var/www/south-delhi-real-estate',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production && pm2 save'
    }
  }
}; 
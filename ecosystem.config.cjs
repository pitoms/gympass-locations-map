// PM2 configuration for production deployment
// Install PM2: npm install -g pm2
// Start: pm2 start ecosystem.config.cjs
// Stop: pm2 stop all
// Logs: pm2 logs

module.exports = {
  apps: [
    {
      name: "gympass-scheduler",
      script: "./server/scheduler.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/scheduler-error.log",
      out_file: "./logs/scheduler-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};

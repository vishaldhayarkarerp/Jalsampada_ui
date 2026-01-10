module.exports = {
  apps: [{
    name: 'jalsampada-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/erpadmin/bench-Jalsampada/apps/Jalsampada_ui',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOSTNAME: '103.219.1.138'
    },
    error_file: '/home/erpadmin/bench-Jalsampada/apps/Jalsampada_ui/logs/err.log',
    out_file: '/home/erpadmin/bench-Jalsampada/apps/Jalsampada_ui/logs/out.log',
    log_file: '/home/erpadmin/bench-Jalsampada/apps/Jalsampada_ui/logs/combined.log',
    time: true
  }]
};

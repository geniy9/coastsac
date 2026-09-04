// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'coast-to-coast',
      script: './server/index.mjs',
      exec_mode: 'cluster',
      instances: 1,
      env: {
        PORT: 3000,
        HOST: '127.0.0.1',
        NODE_ENV: 'production'
      }
    }
  ]
};
module.exports = {
  apps: [
    {
      name: 'coastsac-nuxt',
      script: './server/index.mjs',
      exec_mode: 'cluster',
      instances: 'max',
      env: {
        PORT: 3000,
        NODE_ENV: 'production'
      }
    }
  ]
};
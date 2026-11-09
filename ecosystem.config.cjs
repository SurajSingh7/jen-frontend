// PM2 config for local development: `npm run pm2` starts (or restarts) the Next.js dev server on port 3004.
module.exports = {
  apps: [
    {
      name: "jen-frontend",
      // Run Next's own bin with node (on Windows PM2 can't start "npm" directly)
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3004",
      cwd: __dirname,
      watch: false,
    },
  ],
};

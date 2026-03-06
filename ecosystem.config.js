module.exports = {
  apps: [
    {
      name: "malidag-next",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        NODE_OPTIONS: "--dns-result-order=ipv4first",
        MONGODB_URI: "mongodb+srv://gamanshop33:GAmA1234@cluster0.mu90mbv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        MONGODB_DB: "malidag"
      }
    }
  ]
};

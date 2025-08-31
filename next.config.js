/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize for serverless deployment
  output: 'standalone',
  // Configure for full-stack app
  experimental: {
    esmExternals: true,
  },
}

export default nextConfig

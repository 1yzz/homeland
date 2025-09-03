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
  // Optimize image handling
  images: {
    unoptimized: true, // Disable image optimization for faster builds
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig

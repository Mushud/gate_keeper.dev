/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Optimize package imports for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
  },
}

module.exports = nextConfig

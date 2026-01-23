/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Note: Next.js doesn't have a top-level 'exclude' option
  // Instead, we use experimental config or other approaches
  experimental: {
    // This is an experimental way to exclude directories
    // Alternatively, we'll use a different approach below
  }
}

module.exports = nextConfig  // Make sure this says 'nextConfig' not 'nextConfigs'
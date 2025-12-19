import type { NextConfig } from 'next'
import type { WebpackConfigContext } from 'next/dist/server/config-shared'

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cxifbxhpwkxnsxxpaxwh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'gwfwbijqcqvmtsnpikwz.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // ✅ No webpack import needed
  webpack: (config, _context: WebpackConfigContext) => {
    return config
  },
}

export default withPWA(nextConfig)

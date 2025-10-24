/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public', // output folder for service worker
});

const nextConfig = {
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
};

module.exports = withPWA(nextConfig);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cxifbxhpwkxnsxxpaxwh.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
};
const withPWA = require('next-pwa')({
  dest: 'public', // output folder for service worker
});

export default nextConfig;
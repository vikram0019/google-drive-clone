// filepath: c:\Users\Hp\Downloads\Project-Drive-Clone\project\next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;

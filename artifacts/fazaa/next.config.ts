import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*.replit.dev', '*.sisko.replit.dev', '127.0.0.1'],
  // Expose GOOGLE_API_KEY (Replit secret) as a NEXT_PUBLIC env var
  env: {
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? '',
  },
};

export default nextConfig;

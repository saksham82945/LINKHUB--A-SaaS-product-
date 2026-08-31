/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudfront CDN (user avatars, backgrounds, PDFs)
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
      // LinkedIn profile photos
      {
        protocol: "https",
        hostname: "media.licdn.com",
      },
      // GitHub avatars
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Twitter profile photos
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
    ],
  },
  // Enable React strict mode for catching issues early
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

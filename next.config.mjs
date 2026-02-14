/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://tune-in-backend.vercel.app/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;

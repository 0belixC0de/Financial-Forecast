/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // yahoo-finance2 is a server-only Node package; keep it out of the client bundle.
    serverComponentsExternalPackages: ["yahoo-finance2"],
  },
};

export default nextConfig;

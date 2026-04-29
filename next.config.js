/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  // Keep native / Node-only modules out of the bundle.
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "nodemailer"],
  },
};

module.exports = nextConfig;

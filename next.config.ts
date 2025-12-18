import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ["ngrok-free.dev", ".ngrok-free.dev"],
};

export default nextConfig;

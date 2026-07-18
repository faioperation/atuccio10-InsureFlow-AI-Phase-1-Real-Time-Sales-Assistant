import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for minimal Docker production image (copies server.js + static).
  output: "standalone",
};

export default nextConfig;

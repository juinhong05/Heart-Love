import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Vercel's Next.js output separate from the local Vinext preview files.
  distDir: ".next-vercel",
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;

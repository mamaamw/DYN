import path from "path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  // Force Turbopack to use the repo root (avoid parent lockfile)
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

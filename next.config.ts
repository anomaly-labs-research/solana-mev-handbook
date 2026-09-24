import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every route is prerendered, so ship plain HTML in `out/` and skip a server entirely.
  output: "export",
};

export default nextConfig;

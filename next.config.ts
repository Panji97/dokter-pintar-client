import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev (HMR) dari browser HP di jaringan lokal.
  allowedDevOrigins: ['192.168.18.220'],
};

export default nextConfig;

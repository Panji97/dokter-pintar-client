import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan akses dev (HMR) dari browser HP di jaringan lokal.
  allowedDevOrigins: ["192.168.0.102", "192.168.18.206"],
};

export default nextConfig;

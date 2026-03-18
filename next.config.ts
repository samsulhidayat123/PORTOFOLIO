import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mengganti domains yang deprecated dengan remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: '**', // Mengizinkan semua domain gambar (berguna untuk testing awal)
      },
    ],
  },
  // Mengaktifkan fitur untuk sistem CRUD
  experimental: {
    // Server Actions sudah stabil di versi terbaru, tapi tetap biarkan blok ini jika ingin menambah opsi lain
  },
};

export default nextConfig;
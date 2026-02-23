import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Habilitado para probar push notifications
  register: true,
  skipWaiting: true,
  customWorkerSrc: "worker",
  workboxOptions: {
    disableDevLogs: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
  images: {
    minimumCacheTTL: 31536000, // 1 year cache for optimized images
  },
  async headers() {
    return [
      {
        source: "/:path*.(png|jpg|jpeg|gif|webp|svg|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/icon-:size.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default withPWA(nextConfig)

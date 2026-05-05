import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Office VS Me',
    short_name: 'Office VS Me',
    description: 'Decoding Corporate Reality and Professional Fixes',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F0F0FB',
    theme_color: '#3333CC',
    icons: [
      {
        src: 'https://picsum.photos/seed/hands/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/hands/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}

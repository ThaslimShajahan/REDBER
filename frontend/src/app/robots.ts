import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/'], // disallow private routes
    },
    sitemap: 'https://redber.in/sitemap.xml',
  }
}

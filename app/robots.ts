import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/scanning/', '/confirm/', '/setup/', '/edit/', '/preview/', '/publishing/'],
        },
        sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://panelify.io'}/sitemap.xml`,
    }
}

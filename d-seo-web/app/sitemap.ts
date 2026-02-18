import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://d-seo.es';

    const routes = [
        '/',
        '/servicios/',
        '/servicios/sitios-web/',
        '/servicios/sitios-web/legal/',
        '/servicios/sitios-web/wordpress/',
        '/servicios/ecommerce/',
        '/servicios/ia/',
        '/servicios/apps/',
        '/servicios/seo/',
        '/servicios/seo/local/',
        '/servicios/seo/ecommerce/',
        '/servicios/seo/tecnico/',
        '/servicios/seo/keyword-research/',
        '/servicios/sectores/',
        '/legal/aviso-legal/',
        '/legal/privacidad/',
        '/legal/cookies/',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: route === '/' ? 1 : 0.8,
    }));
}

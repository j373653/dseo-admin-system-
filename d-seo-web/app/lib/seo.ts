import { Metadata } from 'next';

const siteConfig = {
    name: 'D-SEO',
    baseUrl: 'https://d-seo.es/',
    description: 'Ingeniería Digital para Pymes y Autónomos en España. Especialistas en SEO, IA aplicada y Desarollo Web de alto rendimiento.',
};

export function constructMetadata({
    title = siteConfig.name,
    description = siteConfig.description,
    image = '/og-image.png',
    icons = '/favicon.ico',
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string;
    icons?: string;
    noIndex?: boolean;
} = {}): Metadata {
    return {
        title: {
            default: title,
            template: `%s | ${siteConfig.name}`,
        },
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: image,
                },
            ],
            type: 'website',
            siteName: siteConfig.name,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: '@dseo_agency',
        },
        icons,
        metadataBase: new URL(siteConfig.baseUrl),
        ...(noIndex && {
            robots: {
                index: false,
                follow: false,
            },
        }),
    };
}

import { constructMetadata } from '@/app/lib/seo';
import EcommerceClient from './EcommerceClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Desarrollo E-commerce & Tiendas Online | D-SEO',
    description: 'Creamos tiendas online de alto rendimiento. Especialistas en Shopify, WooCommerce y desarrollos a medida con optimización visual por IA.',
});

export default function EcommercePage() {
    return (
        <>
            <EcommerceClient />
            <Footer />
        </>
    );
}

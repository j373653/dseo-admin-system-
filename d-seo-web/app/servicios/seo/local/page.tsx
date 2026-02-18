import { constructMetadata } from '@/app/lib/seo';
import LocalSEOClient from './LocalSEOClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'SEO Local para Negocios & Pymes | D-SEO',
    description: 'Domina Google Maps y atrae clientes de tu zona. Optimizamos tu ficha de Google Business y tu visibilidad local para pymes y autónomos.',
});

export default function LocalSEOPage() {
    return (
        <>
            <LocalSEOClient />
            <Footer />
        </>
    );
}

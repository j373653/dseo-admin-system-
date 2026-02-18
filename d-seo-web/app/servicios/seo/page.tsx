import { constructMetadata } from '@/app/lib/seo';
import SEOHubClient from './SEOHubClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Ingeniería SEO para Pymes | Auditoría y Posicionamiento',
    description: 'Estrategias de SEO técnico y local para dominar Google. Auditorías gratuitas para autónomos y pymes que buscan resultados reales.',
});

export default function SEOHub() {
    return (
        <>
            <SEOHubClient />
            <Footer />
        </>
    );
}

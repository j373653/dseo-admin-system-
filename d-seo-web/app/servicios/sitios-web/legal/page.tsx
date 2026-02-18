import { constructMetadata } from '@/app/lib/seo';
import LegalClient from './LegalClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Auditoría Legal Web RGPD & LSSI | D-SEO',
    description: 'Asegura tu negocio online. Auditorías legales expertas para cumplir con RGPD y LSSI. Evita sanciones y protege la privacidad de tus usuarios.',
});

export default function LegalPage() {
    return (
        <>
            <LegalClient />
            <Footer />
        </>
    );
}

import { constructMetadata } from '@/app/lib/seo';
import IAClient from './IAClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Soluciones de IA para Pymes | Automatización & Agentes',
    description: 'Implementamos Inteligencia Artificial práctica para tu negocio. Cierre de citas automático, chatbots inteligentes y optimización de procesos.',
});

export default function IAPage() {
    return (
        <>
            <IAClient />
            <Footer />
        </>
    );
}

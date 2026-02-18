import { constructMetadata } from '@/app/lib/seo';
import WebServicesClient from './WebServicesClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Desarrollo Web de Alto Rendimiento para Pymes | D-SEO',
    description: 'Creamos activos digitales rápidos, seguros y diseñados para convertir. Ingeniería web con Next.js y enfoque en resultados para autónomos.',
});

export default function WebServicesPage() {
    return (
        <>
            <WebServicesClient />
            <Footer />
        </>
    );
}

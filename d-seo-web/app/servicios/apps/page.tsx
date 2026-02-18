import { constructMetadata } from '@/app/lib/seo';
import AppsClient from './AppsClient';
import Footer from '@/app/components/Footer';

export const metadata = constructMetadata({
    title: 'Desarrollo de Apps & Web Apps para Pymes | D-SEO',
    description: 'Creamos herramientas móviles que ahorran tiempo y fidelizan clientes. Especialistas en PWAs y aplicaciones de gestión interna en España.',
});

export default function AppsPage() {
    return (
        <>
            <AppsClient />
            <Footer />
        </>
    );
}

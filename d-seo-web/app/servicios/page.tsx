import { constructMetadata } from '../lib/seo';
import BentoGrid from '../components/home/BentoGrid';
import Footer from '../components/Footer';

export const metadata = constructMetadata({
    title: 'Catálogo de Servicios Digitales | D-SEO',
    description: 'Explora nuestras soluciones en SEO, Desarrollo Web, E-commerce e Inteligencia Artificial. Ingeniería digital a medida para pymes.',
});

export default function ServicesIndex() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 pt-20">
            <main className="flex-grow flex flex-col justify-center min-h-[60vh]">
                <div className="container mx-auto px-4 text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6">Nuestro Catálogo</h1>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto">Selecciona el área en la que necesitas escalar.</p>
                </div>
                {/* BentoGrid is likely 'use client', but we can import it here as long as we don't use hooks in THIS file */}
                <BentoGrid />
            </main>
            <Footer />
        </div>
    );
}

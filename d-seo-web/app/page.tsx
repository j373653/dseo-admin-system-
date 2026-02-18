import dynamic from 'next/dynamic';
import Hero from './components/home/Hero';
import BentoGrid from './components/home/BentoGrid';
import { constructMetadata } from './lib/seo';

export const metadata = constructMetadata({
    title: 'D-SEO | Ingeniería Web & SEO para Pymes y Autónomos',
    description: 'Transformamos tu negocio con ingeniería digital. Especialistas en SEO Local, IA aplicada y Webs de alto rendimiento que venden 24/7.',
});

import IAShowcase from './components/home/IAShowcase';
import LegalSection from './components/home/LegalSection';
import CustomSolutions from './components/home/CustomSolutions';
import ModernContact from './components/home/ModernContact';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

import SectorsSelector from './components/home/SectorsSelector';

// Dynamic import for 3D component to avoid SSR issues
const InteractiveBackground = dynamic(() => import('./components/3d/InteractiveBackground'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black -z-10" />
});

export default function Home() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
            <ErrorBoundary fallback={<div className="absolute inset-0 bg-black -z-10" />}>
                <InteractiveBackground />
            </ErrorBoundary>

            <main className="relative z-10">
                <Hero />
                <BentoGrid />
                <SectorsSelector />
                <IAShowcase />
                <LegalSection />
                <CustomSolutions />
                <ModernContact />
            </main>

            <Footer />
        </div>
    );
}

import { constructMetadata } from "@/app/lib/seo";
import KeywordResearchClient from "./KeywordResearchClient";
import Footer from "@/app/components/Footer";

export const metadata = constructMetadata({
    title: "Keyword Research Profesional | Estrategia de Contenidos",
    description: "Descubrimos qué buscan tus clientes reales. Estudio de palabras clave avanzado, análisis de intención de búsqueda y estrategia de contenidos SEO para pymes.",
});

export default function KeywordResearchPage() {
    return (
        <>
            <KeywordResearchClient />
            <Footer />
        </>
    );
}

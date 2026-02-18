import { constructMetadata } from "@/app/lib/seo";
import TechnicalSEOClient from "./TechnicalSEOClient";
import Footer from "@/app/components/Footer";

export const metadata = constructMetadata({
    title: "SEO Técnico para Pymes | Auditoría WPO y Salud Web",
    description: "Optimizamos la base técnica de tu web para Google. Especialistas en velocidad de carga (WPO), indexación avanzada y salud técnica para autónomos y pymes.",
});

export default function TechnicalSEOPage() {
    return (
        <>
            <TechnicalSEOClient />
            <Footer />
        </>
    );
}

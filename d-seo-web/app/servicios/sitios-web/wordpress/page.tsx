import { constructMetadata } from "@/app/lib/seo";
import WordPressClient from "./WordPressClient";

export const metadata = constructMetadata({
    title: "Servicios WordPress: Diseño, Mantenimiento y Reparación",
    description: "Expertos en WordPress para pymes. Diseñamos webs rápidas, mantenemos tu sitio seguro y reparamos cualquier error técnico o hackeo.",
});

export default function WordPressPage() {
    return <WordPressClient />;
}

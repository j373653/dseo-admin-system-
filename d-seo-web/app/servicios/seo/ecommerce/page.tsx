import { constructMetadata } from "@/app/lib/seo";
import EcommerceSEOClient from "./EcommerceSEOClient";
import Footer from "@/app/components/Footer";

export const metadata = constructMetadata({
    title: "SEO para E-commerce | Vende más en Google",
    description: "Especialistas en posicionamiento para tiendas online. Optimizamos tus categorías y fichas de producto para atraer tráfico transaccional y escalar tus ventas.",
});

export default function EcommerceSEOPage() {
    return (
        <>
            <EcommerceSEOClient />
            <Footer />
        </>
    );
}

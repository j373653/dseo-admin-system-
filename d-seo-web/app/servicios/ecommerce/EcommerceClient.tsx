'use client';

import { motion } from 'framer-motion';
import {
    ShoppingBag,
    CreditCard,
    Truck,
    BarChart3,
    ArrowRight,
    Settings,
    Search,
    Zap,
    Globe,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import ProductShowcase from '@/app/components/ecommerce/ProductShowcase';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';
import { CheckCircle2 } from 'lucide-react';

const features = [
    {
        title: "Optimización de Fichas",
        desc: "Transformamos tus productos en activos de venta con copywriting persuasivo y estructura orientada a la conversión (CRO).",
        icon: Zap
    },
    {
        title: "Contenido Visual IA",
        desc: "Mejoramos tus fotos de producto y generamos vídeos comerciales impactantes usando Inteligencia Artificial avanzada.",
        icon: Globe
    },
    {
        title: "Analítica Avanzada",
        desc: "DASHBOARDS personalizados para entender quién te compra y por qué, optimizando tu margen de beneficio.",
        icon: BarChart3
    },
    {
        title: "SEO para Productos",
        desc: "Arquitectura pensada para que tus productos aparezcan los primeros en Google con estrellas y precios.",
        icon: Search
    }
];

const ecommerceFAQs = [
    {
        question: "¿Qué plataforma es mejor para mí: Shopify o WooCommerce?",
        answer: "Depende de tu presupuesto y volumen de ventas. Shopify es ideal para empezar rápido sin complicaciones técnicas. WooCommerce ofrece control total y no tiene cuotas fijas por venta. Nosotros te asesoramos gratis."
    },
    {
        question: "¿Puedo cobrar por Bizum o Apple Pay?",
        answer: "Sí, integramos todos los métodos de pago modernos para que tus clientes no tengan excusas al comprar."
    },
    {
        question: "¿Cómo gestiono el stock?",
        answer: "Tendrás un panel de control intuitivo en tu móvil. Si vendes en tienda física, podemos sincronizarlo para que no vendas nada que no tengas."
    }
];

export default function EcommerceClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-rose-500/30">

            {/* HERO */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <Link href="/servicios/sitios-web" className="inline-flex items-center text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider gap-2">
                        <ArrowRight className="rotate-180" size={16} /> Volver a Web
                    </Link>
                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-[0.9] px-4 pb-4 overflow-visible"
                        >
                            VENDE EN PIJAMA. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 py-2 inline-block italic pr-4">TIENDAS ONLINE</span> QUE VUELAN.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12 font-light"
                        >
                            Tu escaparate digital abierto 24 horas, optimizado para móvil y listo para vender desde el primer día. Nosotros nos encargamos de los píxeles, tú de los pedidos.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-rose-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-rose-600/20">
                                Empezar a Vender
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Zap className="text-rose-500" /> Especialistas en Shopify & Woo
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STACK CARDS */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-black border border-white/10 hover:border-rose-500/30 transition-all"
                            >
                                <f.icon className="text-rose-500 mb-6" size={32} />
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* IA VISUAL OPTIMIZATION SECTION */}
            <section className="py-32 bg-gradient-to-b from-black to-slate-900/50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row-reverse gap-16 items-center">
                        <div className="lg:w-1/2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-500 text-xs font-black uppercase tracking-widest mb-6">
                                <Zap size={14} /> Innovación Pyme
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[0.9] tracking-tighter">
                                TU CATÁLOGO, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500">REINVENTADO CON IA.</span>
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                El 75% de los compradores online deciden basándose en la foto del producto. Usamos IA para generar entornos hiper-realistas para tus productos sin costes de estudio fotográfico.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-all">
                                    <h4 className="font-bold text-white mb-2">Visual SEO</h4>
                                    <p className="text-slate-500 text-sm">Optimizamos imágenes para que Google Imágenes sea tu mayor fuente de tráfico gratuito.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-400/30 transition-all">
                                    <h4 className="font-bold text-white mb-2">Generación de Vídeo</h4>
                                    <p className="text-slate-500 text-sm">Convertimos fotos estáticas en vídeos de producto dinámicos para redes sociales.</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-full relative">
                            <ProductShowcase />
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO FOR ECOMMERCE - INTERLINKING */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-[3.5rem] p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <TrendingUp size={150} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="md:w-2/3">
                                <h3 className="text-3xl font-black mb-6 uppercase">Vender es solo la mitad. <br /><span className="text-rose-500 italic">Que te encuentren es el resto.</span></h3>
                                <p className="text-slate-400 text-lg mb-8">
                                    Una tienda sin SEO es como un local de lujo en una calle desierta. Optimizamos tu catálogo para aparecer en Google con precio y stock real.
                                </p>
                                <Link href="/servicios/seo/ecommerce" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black hover:scale-105 transition-transform uppercase tracking-tighter">
                                    Ingeniería SEO para Tiendas <ArrowRight size={20} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO INTERLINKING CTAs */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black mb-12 italic uppercase tracking-tighter">¿TIENES LA TIENDA PERO <span className="text-rose-500">NADIE LLEGA?</span></h2>
                    <div className="max-w-4xl mx-auto p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center gap-8 justify-between">
                        <div className="text-left">
                            <h4 className="text-xl font-bold mb-2">Estrategia de Tráfico E-commerce</h4>
                            <p className="text-slate-500 text-sm">Tu tienda no es una isla. Necesitas que tus productos aparezcan donde tus clientes buscan.</p>
                        </div>
                        <Link href="/servicios/seo" className="px-8 py-4 bg-white text-black rounded-xl font-black hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 whitespace-nowrap">
                            Ver SEO para Tiendas <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* NEW SECTIONS */}
            <ProcessRoadmap />

            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 uppercase italic tracking-tighter">Tu tienda, <span className="text-rose-500">en el móvil</span> de tu cliente</h2>
                    <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto font-light">
                        El 80% de las ventas en pymes ocurren desde un teléfono. Por eso, nuestras tiendas no solo se ven bien, sino que están optimizadas para un checkout ultra-rápido con Bizum y Apple Pay.
                    </p>
                    <div className="max-w-4xl mx-auto p-1 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-[3rem]">
                        <div className="bg-black rounded-[2.8rem] p-8 md:p-12 border border-white/5">
                            <div className="grid md:grid-cols-3 gap-8">
                                {[
                                    { label: "Check-out rápido", val: "Bizum/Stripe" },
                                    { label: "Carga inmediata", val: "< 1 Segundo" },
                                    { label: "Gestión fácil", val: "Desde el móvil" }
                                ].map((stat, i) => (
                                    <div key={i} className="space-y-2">
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                                        <p className="text-xl font-bold text-white">{stat.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection items={ecommerceFAQs} title="Preguntas sobre tu tienda online" />

            <MiniContactForm
                serviceName="E-commerce Pyme"
                title="¿Damos el salto a la venta online?"
                subtitle="Cuéntanos qué vendes y te asesoraremos sobre la mejor plataforma para tu caso concreto."
            />
        </div>
    );
}

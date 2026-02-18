'use client';

import { motion } from 'framer-motion';
import {
    Search,
    MapPin,
    ShoppingBag,
    Zap,
    ArrowRight,
    Globe,
    Target,
    BarChart
} from 'lucide-react';
import Link from 'next/link';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';
import { CheckCircle2 } from 'lucide-react';

const subServices = [
    {
        title: "SEO Local para Negocios",
        desc: "Domina tu ciudad. Optimizamos tu ficha de Google Business y tu web para que los clientes de tu zona te encuentren antes que a la competencia.",
        href: "/servicios/seo/local",
        icon: MapPin,
        color: "text-cyan-400",
        bg: "bg-cyan-500/10"
    },
    {
        title: "SEO para E-commerce",
        desc: "No solo visitas, sino ventas. Estructuramos tus productos para que aparezcan con precio y stock directamente en los resultados de Google.",
        href: "/servicios/seo/ecommerce",
        icon: ShoppingBag,
        color: "text-rose-400",
        bg: "bg-rose-500/10"
    },
    {
        title: "SEO Técnico & WPO",
        desc: "Analizamos por qué tu web no está posicionando: velocidad, errores técnicos y falta de autoridad. Detectamos el freno y lo soltamos.",
        href: "/servicios/seo/tecnico",
        icon: Target,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        title: "Keyword Research Pro",
        desc: "Descubrimos qué buscan tus clientes reales y cómo superar a tu competencia con una estrategia de contenidos inteligente y rentable.",
        href: "/servicios/seo/keyword-research",
        icon: BarChart,
        color: "text-amber-400",
        bg: "bg-amber-500/10"
    }
];

const seoFAQs = [
    {
        question: "¿Cuánto tiempo tardaré en aparecer en la primera página?",
        answer: "El SEO es una carrera de fondo, no un sprint. Dependiendo de tu competencia, solemos ver resultados significativos entre los 3 y 6 meses. La paciencia es la clave del éxito duradero."
    },
    {
        question: "¿Me garantizas el puesto número 1 en Google?",
        answer: "Nadie puede garantizar el puesto #1 legalmente (ni siquiera Google). Lo que sí garantizamos es una mejora drástica en tu visibilidad y tráfico cualificado mediante ingeniería y mejores prácticas."
    },
    {
        question: "¿Es mejor el SEO o pagar anuncios (SEM)?",
        answer: "Los anuncios son como alquilar una casa: si dejas de pagar, te vas. El SEO es como comprarla: el esfuerzo se acumula y con el tiempo te da beneficios sin depender de un presupuesto publicitario diario."
    }
];

export default function SEOHubClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-cyan-500/30">
            {/* HERO SEO HUB */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-[0.9] px-4 pb-4 overflow-visible"
                        >
                            DEJA DE SER <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 italic py-2 inline-block">INVISIBLE.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12 font-light"
                        >
                            ¿Tienes una web preciosa que nadie visita? Es como tener un Ferrari guardado en un garaje sin salida. Aplicamos ingeniería para que tus clientes te encuentren los primeros.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
                                Aparecer en Google
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Zap className="text-cyan-500" /> Ingeniería de Posicionamiento Real
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SUB-SERVICES GRID (THE HUB) */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {subServices.map((service, i) => (
                            <Link key={i} href={service.href}>
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    className="h-full p-8 rounded-[2rem] bg-black border border-white/10 hover:border-cyan-500/30 transition-all group relative overflow-hidden"
                                >
                                    <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                        <service.icon className={service.color} size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{service.title}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8">{service.desc}</p>
                                    <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                        Explorar Servicio <ArrowRight size={14} className="text-cyan-500" />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEW SECTIONS */}
            <ProcessRoadmap />

            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic py-4 overflow-visible leading-tight">
                                NO ES MAGIA. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 pr-8 inline-block">ES SOBRESALIR.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                                El SEO real no va de "engañar a Google". Va de demostrarle que eres la mejor opción para tu cliente. Optimizamos tu estructura, tu velocidad y tu contenido para que no tengan elección.
                            </p>
                            <div className="space-y-4 mb-10">
                                {["Aparece en Google Maps", "SEO Técnico sin errores", "Contenido que Convierte"].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300">
                                        <CheckCircle2 className="text-cyan-500" size={18} /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] -z-10" />
                            <div className="bg-black border border-white/10 rounded-3xl p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Zap size={120} />
                                </div>
                                <h3 className="text-3xl font-black mb-6 uppercase italic">Auditoría <br />Pyme Gratis</h3>
                                <p className="text-slate-400 mb-8 text-lg">
                                    Analizamos tu web actual y te decimos <span className="text-white font-bold">exactamente</span> por qué tu competencia te está adelantando en Google.
                                </p>
                                <Link href="#contacto" className="block w-full py-5 border border-white/20 text-white rounded-2xl font-black text-center group-hover:bg-white group-hover:text-black transition-all">
                                    Analizar mi Web
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection items={seoFAQs} title="Preguntas sobre Posicionamiento SEO" />

            <MiniContactForm
                serviceName="Estrategia SEO"
                title="¿Damos el salto a la primera página?"
                subtitle="Cuéntanos quién es tu competencia y te diremos cómo vamos a superarlos paso a paso."
            />
        </div>
    );
}

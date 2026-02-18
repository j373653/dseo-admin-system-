'use client';

import { motion } from 'framer-motion';
import {
    Zap,
    ShieldCheck,
    Search,
    ArrowRight,
    Activity,
    Code,
    Gauge,
    Server,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

const techFeatures = [
    {
        title: "Optimización WPO",
        desc: "Reducimos el tiempo de carga al mínimo. Google ama las webs rápidas y tus usuarios también.",
        icon: Gauge,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Indexación Perfecta",
        desc: "Aseguramos que Google rastree e indexe todo tu contenido sin errores mediante Sitemaps y Robots.txt optimizados.",
        icon: Server,
        color: "text-blue-400",
        bg: "bg-blue-400/10"
    },
    {
        title: "Salud Técnica",
        desc: "Corrección de errores 404, redirecciones mal gestionadas y marcado de Schema para resultados enriquecidos.",
        icon: Activity,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    }
];

export default function TechnicalSEOClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-blue-500/30">
            {/* HERO */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <Link href="/servicios/seo" className="inline-flex items-center text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider gap-2">
                        <ArrowRight className="rotate-180" size={16} /> Volver a SEO
                    </Link>

                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-tight px-4 pb-4 overflow-visible"
                        >
                            SEO TÉCNICO <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 italic py-2 inline-block">ALTO RENDIMIENTO.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                        >
                            El motor de tu web debe estar a punto. Optimizamos la infraestructura técnica para que Google rastree tu sitio sin fricciones y con la máxima velocidad.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-blue-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-blue-600/20">
                                Analizar mi Web
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Code className="text-blue-500" /> Ingeniería de WPO
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TECH GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {techFeatures.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all group"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-10`}>
                                    <s.icon className={s.color} size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.title}</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                                    {s.desc}
                                </p>
                                <ul className="space-y-2">
                                    {["Core Web Vitals", "Carga Diferida", "Minificación de código"].slice(0, 3).map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-blue-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CORE WEB VITALS SECTION */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto bg-black border border-white/10 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
                        <div className="md:w-1/2">
                            <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tight leading-none">Dominamos las <br /><span className="text-blue-500">Core Web Vitals</span></h2>
                            <p className="text-slate-400 mb-8 text-lg">Google ya no solo mira tus palabras, mira tu experiencia de usuario. Si tu web no es rápida, estarás siempre un paso por detrás.</p>
                            <div className="space-y-4">
                                {["LCP (Largest Contentful Paint)", "FID (First Input Delay)", "CLS (Cumulative Layout Shift)"].map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                        <span className="font-bold text-sm uppercase tracking-wider">{v}</span>
                                        <span className="text-emerald-500 font-black">90+</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:w-1/2 relative group">
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl animate-pulse" />
                            <div className="relative aspect-square border border-white/10 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center">
                                <Activity size={100} className="text-blue-500 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute bottom-8 left-8 right-8 text-center bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5">
                                    <p className="text-[10px] font-black uppercase text-slate-500">Métrica de Rendimiento Real</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

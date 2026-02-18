'use client';

import { motion } from 'framer-motion';
import {
    Search,
    Target,
    BarChart,
    ArrowRight,
    CheckCircle2,
    PenTool,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';

const kwFeatures = [
    {
        title: "Intención de Búsqueda",
        desc: "No buscamos palabras, buscamos clientes. Analizamos qué necesita el usuario para darle la respuesta exacta.",
        icon: Target,
        color: "text-purple-400",
        bg: "bg-purple-400/10"
    },
    {
        title: "Análisis Competencia",
        desc: "Estudiamos qué están haciendo tus competidores para encontrar nichos y oportunidades donde tú puedas liderar.",
        icon: Users,
        color: "text-cyan-400",
        bg: "bg-cyan-400/10"
    },
    {
        title: "Estrategia de Contenido",
        desc: "Estructuramos un calendario editorial basado en datos para que cada página que publiques atraiga tráfico cualificado.",
        icon: PenTool,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    }
];

export default function KeywordResearchClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-purple-500/30">
            {/* HERO */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
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
                            KEYWORD <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 italic py-2 inline-block">RESEARCH PRO.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                        >
                            La base de todo éxito en Google. Descubrimos qué buscan tus clientes reales y cómo superar a tu competencia con una estrategia de contenidos inteligente.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-purple-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-purple-600/20">
                                Estudio de Palabras
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <BarChart className="text-purple-500" /> Estrategia de Datos
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {kwFeatures.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all group"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-10`}>
                                    <s.icon className={s.color} size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-purple-400 transition-colors uppercase tracking-tight">{s.title}</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                                    {s.desc}
                                </p>
                                <ul className="space-y-2">
                                    {["KW Semánticas", "Volumen Real", "Estudio de Competencia"].slice(0, 3).map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-purple-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

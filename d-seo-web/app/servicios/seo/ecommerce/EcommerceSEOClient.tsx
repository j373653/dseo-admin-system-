'use client';

import { motion } from 'framer-motion';
import {
    ShoppingBag,
    TrendingUp,
    BarChart,
    ArrowRight,
    CheckCircle2,
    Tags,
    LayoutTemplate,
    Search
} from 'lucide-react';
import Link from 'next/link';

const shopFeatures = [
    {
        title: "Arquitectura de Tienda",
        desc: "Estructuramos categorías y subcategorías para que Google entienda toda tu gama de productos.",
        icon: LayoutTemplate,
        color: "text-rose-400",
        bg: "bg-rose-400/10"
    },
    {
        title: "Rich Snippets",
        desc: "Hacemos que tus productos muestren precio, stock y estrellitas directamente en los resultados de búsqueda.",
        icon: Tags,
        color: "text-amber-400",
        bg: "bg-amber-400/10"
    },
    {
        title: "Optimización de Fichas",
        desc: "Convertimos descripciones sosas en imanes para el buscador y para el usuario.",
        icon: ShoppingBag,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10"
    }
];

export default function EcommerceSEOClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-rose-500/30">
            {/* HERO */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
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
                            SEO PARA <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 italic py-2 inline-block">E-COMMERCE.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                        >
                            Vender más empieza por que te vean más. Optimizamos tu tienda online para atraer tráfico transaccional: personas listas para comprar.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-rose-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-rose-600/20">
                                Escalar mis Ventas
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <ShoppingBag className="text-rose-500" /> Especialistas en Conversión
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {shopFeatures.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all group"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-10`}>
                                    <s.icon className={s.color} size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-rose-400 transition-colors uppercase tracking-tight">{s.title}</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed text-sm">
                                    {s.desc}
                                </p>
                                <ul className="space-y-2">
                                    {["JSON-LD Products", "Filtros Navegables", "SEO de Imágenes"].slice(0, 3).map((f, j) => (
                                        <li key={j} className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-rose-500" /> {f}
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

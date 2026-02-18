'use client';

import { motion } from 'framer-motion';
import {
    MapPin,
    Search,
    Star,
    BarChart,
    ArrowRight,
    CheckCircle2,
    Navigation,
    Globe
} from 'lucide-react';
import Link from 'next/link';

const localFeatures = [
    {
        title: "Google Business Profile",
        desc: "Optimizamos tu ficha para que aparezcas en el 'Local Pack' (los 3 primeros resultados de Maps).",
        icon: MapPin,
        color: "from-orange-500 to-amber-500"
    },
    {
        title: "Gestión de Reseñas",
        desc: "Estrategias para conseguir valoraciones positivas reales que generen confianza inmediata.",
        icon: Star,
        color: "from-blue-500 to-indigo-500"
    },
    {
        title: "SEO Local de Contenidos",
        desc: "Creamos páginas específicas para cada ciudad o barrio donde prestas servicio.",
        icon: Search,
        color: "from-emerald-500 to-teal-500"
    }
];

export default function LocalSEOClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-orange-500/30">

            {/* HERO */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
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
                            DOMINA TU <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 italic py-2 inline-block">ZONA LOCAL.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                        >
                            Si tu negocio tiene una ubicación física o prestas servicio en una zona concreta, necesitas estar donde tus clientes te buscan: Google Maps y búsquedas locales.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-orange-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-orange-600/20">
                                Auditoría Local Gratis
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Navigation className="text-orange-500" /> Especialistas en Gremios
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STRATEGY GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Nuestra Estrategia de Proximidad</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Convertimos tu ubicación geográfica en tu mayor ventaja competitiva.</p>
                </div>
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {localFeatures.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all group"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-10 shadow-lg shadow-black/40`}>
                                    <s.icon className="text-white" size={32} />
                                </div>

                                <h3 className="text-2xl font-black mb-4 group-hover:text-orange-400 transition-colors uppercase tracking-tight">{s.title}</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed text-sm font-medium">
                                    {s.desc}
                                </p>

                                <div className="space-y-3">
                                    {["Optimización NAP (Name, Address, Phone)", "Geolocalización de Imágenes", "Citas en Directorios Locales"].slice(0, 3).map((f, j) => (
                                        <div key={j} className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-orange-500" /> {f}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RESULTADOS SECTION */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5 overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-orange-500/20 blur-[100px] -z-10" />
                            <div className="bg-black border border-white/10 rounded-3xl p-8 relative">
                                <div className="flex justify-between items-center mb-12">
                                    <h4 className="text-xl font-black">Visibilidad en Maps</h4>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">+240% este mes</span>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Búsquedas de descubrimiento", val: "85%", color: "bg-orange-500" },
                                        { label: "Acciones de 'Cómo llegar'", val: "92%", color: "bg-orange-400" },
                                        { label: "Llamadas directas", val: "78%", color: "bg-orange-300" }
                                    ].map((g, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                                <span>{g.label}</span>
                                                <span>{g.val}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: g.val }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className={`h-full ${g.color}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter uppercase italic">Haz que te encuentren a la vuelta de la esquina</h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                                El 46% de todas las búsquedas en Google tienen una intención local. Si no apareces en el mapa, simplemente no existes para el cliente que te necesita hoy.
                            </p>
                            <ul className="grid sm:grid-cols-2 gap-6 mb-12 text-sm">
                                {["Gremios y Servicios", "Negocios a pie de calle", "Franquicias y Multi-sedes", "Venta de Proximidad"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 font-bold">
                                        <CheckCircle2 className="text-orange-500" size={20} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link href="#contacto" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black rounded-full font-black text-xl hover:bg-orange-500 hover:text-white transition-all shadow-2xl">
                                Posicionar mi Negocio <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* COMPLEMENTARY SERVICES - INTERLINKING */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-4">
                    <h3 className="text-2xl font-black mb-12 text-center uppercase tracking-tighter">Sinergias para <span className="text-orange-500">tu crecimiento</span></h3>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Link href="/servicios/seo" className="group p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-xl mb-2 group-hover:text-orange-400 transition-colors">Estrategia SEO Global</h4>
                                <p className="text-slate-500 text-sm">Más allá de tu ciudad: posicionamiento nacional y auditoría técnica.</p>
                            </div>
                            <ArrowRight className="text-orange-500 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link href="/servicios/apps" className="group p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-xl mb-2 group-hover:text-emerald-400 transition-colors">Apps de Fidelización</h4>
                                <p className="text-slate-500 text-sm">Una vez te encuentran, mantén a tus clientes con una App para tu negocio.</p>
                            </div>
                            <ArrowRight className="text-emerald-500 group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

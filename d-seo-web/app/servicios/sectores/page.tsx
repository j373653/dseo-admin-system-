'use client';

import { motion } from 'framer-motion';
import {
    Building2,
    Stethoscope,
    Scale,
    Hammer,
    Home,
    Store,
    ArrowRight,
    Briefcase,
    Smartphone,
    Code as CodeIcon
} from 'lucide-react';
import Link from 'next/link';

const sectors = [
    {
        id: "legales",
        name: "Abogados y Consultoría",
        icon: Scale,
        color: "from-blue-600 to-indigo-600",
        solution: "Automatización de contratos y captación de leads cualificados.",
        features: ["Reserva de citas online", "Firma digital integrada", "SEO para servicios jurídicos"]
    },
    {
        id: "salud",
        name: "Clínicas y Salud",
        icon: Stethoscope,
        color: "from-emerald-600 to-teal-600",
        solution: "Gestión de pacientes y recordatorios automáticos por WhatsApp.",
        features: ["Historial digital seguro", "Integración con CRM médico", "Google My Business optimizado"]
    },
    {
        id: "reformas",
        name: "Reformas y Construcción",
        icon: Hammer,
        color: "from-orange-600 to-amber-600",
        solution: "Webs visuales con galerías de proyectos y presupuestadores online.",
        features: ["Galería de proyectos 8K", "Calculadora de presupuestos", "SEO Local intensivo"]
    },
    {
        id: "inmobiliaria",
        name: "Inmobiliarias",
        icon: Home,
        color: "from-rose-600 to-pink-600",
        solution: "Sincronización automática con portales y tours virtuales IA.",
        features: ["Importación de Idealista/Fotocasa", "Chatbots inmobiliarios", "Mapas interactivos"]
    },
    {
        id: "comercio",
        name: "Pequeño Comercio",
        icon: Store,
        color: "from-purple-600 to-violet-600",
        solution: "Paso del negocio físico al digital con stock sincronizado.",
        features: ["Click & Collect", "Fidelización de clientes", "Gestión de reseñas"]
    },
    {
        id: "servicios",
        name: "Servicios Profesionales",
        icon: Briefcase,
        color: "from-cyan-600 to-blue-600",
        solution: "Posicionado como autoridad en tu nicho para atraer clientes B2B.",
        features: ["Blog de marca personal", "LinkedIn Automation", "Embudos de venta"]
    }
];

export default function SectorsPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-cyan-500/30">

            {/* HEADER */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-8xl font-black mb-8 tracking-tighter overflow-visible"
                    >
                        SOLUCIONES POR <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-black italic pr-4">TU GREMIO</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
                    >
                        No creemos en soluciones genéricas. Hemos analizado las necesidades de cada sector para ofrecer la tecnología exacta que tu negocio necesita.
                    </motion.p>
                </div>
            </section>

            {/* SECTOR GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sectors.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group relative h-full flex flex-col p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-white/[0.06] transition-all overflow-hidden"
                            >
                                {/* Decorative background glow */}
                                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity`} />

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-8 shadow-lg shadow-black/40`}>
                                    <s.icon className="text-white" size={32} />
                                </div>

                                <h3 className="text-2xl font-black mb-4 group-hover:text-cyan-400 transition-colors">{s.name}</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed font-medium">"{s.solution}"</p>

                                <div className="flex-grow space-y-4 mb-10">
                                    {s.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-3 text-sm text-slate-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href="#contacto"
                                    className="mt-auto w-full py-4 text-center border border-white/10 rounded-2xl font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-all"
                                >
                                    Ver Solución a Medida
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI & APPS FOR GUILDS */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-600/5 rounded-full blur-[120px] -z-10" />
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic overflow-visible py-4">
                                IA Y APPS <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 pr-8 leading-tight inline-block">A MEDIDA DE TU SECTOR.</span>
                            </h2>
                            <p className="text-xl text-slate-400 mb-10 leading-relaxed font-light">
                                Tu gremio tiene procesos únicos. ¿Por qué usar software genérico? Creamos herramientas que se adaptan a tu forma de trabajar, no al revés.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <Link href="/servicios/ia" className="group/link space-y-4 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover/link:scale-110 transition-transform">
                                        <Briefcase size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                        IA Especializada <ArrowRight size={16} />
                                    </h4>
                                    <p className="text-sm text-slate-500">Agentes que conocen la terminología de tu sector y automatizan tus tareas administrativas más pesadas.</p>
                                </Link>
                                <Link href="/servicios/apps" className="group/link space-y-4 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/link:scale-110 transition-transform">
                                        <Smartphone size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                        Apps de Gestión <ArrowRight size={16} />
                                    </h4>
                                    <p className="text-sm text-slate-500">Tu negocio en el bolsillo. Control de partes de trabajo, stock y citas desde cualquier lugar.</p>
                                </Link>
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-1 bg-gradient-to-br from-white/10 to-transparent rounded-[3rem]">
                            <div className="bg-black rounded-[2.8rem] p-12 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CodeIcon size={120} />
                                </div>
                                <h3 className="text-3xl font-black mb-8 italic">¿Qué podemos crear para ti?</h3>
                                <ul className="space-y-6 mb-12">
                                    {[
                                        "Automatización de Presupuestos IA",
                                        "App de seguimiento de obras/proyectos",
                                        "Gestor de expedientes con IA Jurídica",
                                        "Portal de cliente con reservas y pagos",
                                        "Sincronización de stock en tiempo real"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 group/item">
                                            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                <ArrowRight size={14} className="text-black" />
                                            </div>
                                            <span className="font-bold text-slate-200">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href="#contacto" className="w-full block py-5 bg-white text-black text-center rounded-2xl font-black text-xl hover:bg-cyan-500 transition-colors">
                                    Analizar mi Gremio
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-24 border-t border-white/5 bg-gradient-to-b from-black to-blue-900/10">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-black mb-6">¿Tu sector no está en la lista?</h2>
                    <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
                        No hay problema. Somos especialistas en estudiar procesos de negocio y aplicar la tecnología justa. Cuéntanos qué haces y nosotros te diremos cómo escalarlo.
                    </p>
                    <Link href="#contacto" className="inline-flex items-center gap-3 px-10 py-5 bg-cyan-500 text-black rounded-full font-black text-xl hover:scale-105 transition-transform">
                        Consultar mi Gremio <ArrowRight size={24} />
                    </Link>
                </div>
            </section>

        </div>
    );
}

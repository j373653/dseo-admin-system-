'use client';

import { motion } from 'framer-motion';
import {
    Layout,
    Settings,
    Wrench,
    Zap,
    ShieldCheck,
    ArrowRight,
    Search,
    RefreshCw,
    LifeBuoy
} from 'lucide-react';
import Link from 'next/link';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';

const wpServices = [
    {
        title: "Diseño & Desarrollo",
        desc: "Creamos webs WordPress desde cero, con diseños exclusivos y optimizadas para Google. Sin plantillas pesadas ni código sucio.",
        icon: Layout,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    {
        title: "Mantenimiento Pro",
        desc: "Nos encargamos de las actualizaciones, copias de seguridad y seguridad. Para que tú te centres en vender y no en el panel de control.",
        icon: RefreshCw,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10"
    },
    {
        title: "Reparación & WPO",
        desc: "¿Tu WordPress va lento o ha sido hackeado? Limpiamos código, eliminamos virus y optimizamos la velocidad al máximo.",
        icon: Wrench,
        color: "text-rose-400",
        bg: "bg-rose-500/10"
    }
];

const wpFAQs = [
    {
        question: "¿Por qué WordPress si sois una agencia de ingeniería?",
        answer: "WordPress es la herramienta más versátil del mercado. La usamos no por limitación, sino por su potencia cuando se sabe optimizar técnicamente (Headless o con arquitecturas limpias)."
    },
    {
        question: "¿Qué pasa si mi WordPress está hackeado?",
        answer: "Tenemos un servicio de urgencia para limpieza web. Recuperamos tu sitio, eliminamos el malware y lo blindamos para que no vuelva a suceder."
    },
    {
        question: "¿Incluye el hosting?",
        answer: "Sí, todos nuestros planes de mantenimiento incluyen hosting de alto rendimiento optimizado específicamente para las exigencias de WordPress."
    }
];

export default function WordPressClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-blue-500/30">
            {/* HERO WP */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-[0.9] px-4 pb-4 overflow-visible"
                        >
                            WORDPRESS <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-500 italic py-2 inline-block">SIN LÍMITES.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12 font-light"
                        >
                            Domina el CMS más popular del mundo con ingeniería real. Olvida las webs lentas y los errores de plugins. Creamos, mantenemos y reparamos tu WordPress para que sea impecable.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
                                Potenciar mi WordPress
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <ShieldCheck className="text-blue-500" /> Soporte Técnico Especializado
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {wpServices.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all group"
                            >
                                <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/40`}>
                                    <s.icon className={s.color} size={28} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{s.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <ProcessRoadmap />

            {/* MANTENIMIENTO SECTION */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tight uppercase italic py-4 overflow-visible leading-none">¿TU WEB VA LENTA O DA ERRORES?</h2>
                    <p className="text-slate-400 text-xl max-w-3xl mx-auto mb-16 leading-relaxed font-light">
                        No dejes que un problema técnico espante a tus clientes. Ofrecemos mantenimiento preventivo y reparación urgente de WordPress.
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {[
                            { t: "Limpieza Malware", i: ShieldCheck },
                            { t: "Optimización WPO", i: Zap },
                            { t: "Soporte 24/7", i: LifeBuoy },
                            { t: "SEO Técnico", i: Search }
                        ].map((item, idx) => (
                            <div key={idx} className="p-8 border border-white/5 rounded-3xl bg-black hover:border-emerald-500/30 transition-colors group">
                                <item.i className="mx-auto mb-4 text-white group-hover:text-emerald-400 transition-colors" size={32} />
                                <h4 className="font-bold uppercase tracking-widest text-[10px] text-slate-500 group-hover:text-white transition-colors">{item.t}</h4>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/servicios/sitios-web/legal"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-lg shadow-emerald-500/5 group"
                    >
                        Auditoría Legal WordPress <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            <FAQSection items={wpFAQs} title="Preguntas sobre WordPress" />

            <MiniContactForm
                serviceName="Servicios WordPress"
                title="¿Problemas con tu WordPress?"
                subtitle="Cuéntanos qué necesitas (nueva web, mantenimiento o reparación) y te daremos una solución técnica profesional en menos de 24h."
            />
        </div>
    );
}

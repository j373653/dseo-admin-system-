'use client';

import { motion } from 'framer-motion';
import {
    Globe,
    Zap,
    ShieldCheck,
    Smartphone,
    ArrowRight,
    Search,
    Code,
    Layout,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';

const webFeatures = [
    {
        title: "Webs que Venden",
        desc: "No diseñamos 'folletos digitales'. Creamos embudos de venta optimizados que guían al cliente desde el primer clic hasta el contacto.",
        icon: Layout,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "Velocidad Extrema",
        desc: "Cada segundo de carga cuesta dinero. Usamos Next.js para que tu web abra en menos de 1 segundo, mejorando tu SEO y conversión.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        title: "Seguridad Robusta",
        desc: "Blindamos tu presencia online. SSL, protección contra ataques y copias de seguridad automáticas diarias.",
        icon: ShieldCheck,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    }
];

const webFAQs = [
    {
        question: "¿Cuánto tarda en estar lista mi web?",
        answer: "Para una web comercial estándar, solemos tardar entre 2 y 3 semanas. Queremos que empieces a captar clientes lo antes posible."
    },
    {
        question: "¿Es difícil de gestionar si no sé de informática?",
        answer: "Para nada. Te entregamos una herramienta 'llave en mano' y te damos una formación de 15 minutos para que puedas cambiar textos o fotos tú mismo."
    },
    {
        question: "¿Se verá bien en móviles?",
        answer: "Hoy en día el 80% de tus clientes vendrán por el móvil. Por eso, diseñamos tu web pensando primero en el teléfono y luego en el ordenador."
    }
];

export default function WebServicesClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans">
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-tight px-4 pb-4 overflow-visible"
                        >
                            TU PERSIANA <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 italic py-2 inline-block">SIEMPRE ARRIBA.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12 font-light"
                        >
                            No hacemos "páginas". Creamos tu oficina digital que trabaja 24/7. Rápida, segura y diseñada para que el teléfono no pare de sonar.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10">
                                Digitalizar mi Negocio
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <Zap className="text-blue-500" /> Ingeniería de Conversión
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {webFeatures.map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:border-blue-500/30 transition-all group"
                            >
                                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/40`}>
                                    <f.icon className={f.color} size={28} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{f.title === "Webs que Venden" ? "Web que vende por ti" : f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <ProcessRoadmap />

            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] -z-10" />
                            <div className="bg-black border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ShieldCheck size={120} />
                                </div>
                                <h3 className="text-3xl font-black mb-6 uppercase italic tracking-tight">Tu web, <br />siempre en forma</h3>
                                <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                                    Nos encargamos de que tu web siempre vuele. Copias de seguridad diarias, seguridad contra ataques y actualizaciones constantes. Tú solo ocúpate de tus clientes.
                                </p>
                                <div className="space-y-4 mb-10">
                                    {["Soporte Ultra-rápido", "Hospedaje de alta velocidad", "SEO On-Page incluido"].map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300">
                                            <CheckCircle2 className="text-blue-500" size={18} /> {f}
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href="/servicios/sitios-web/legal"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all group"
                                >
                                    Auditoría Legal RGPD/LSSI <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic py-4 overflow-visible">
                                MÓVIL PRIMERO <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 pr-8 leading-tight inline-block text-5xl md:text-7xl">COMO DEBE SER.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                                Si tu web tarda más de 3 segundos en cargar en el móvil de tu cliente, has perdido la venta. Usamos tecnología de vanguardia para que tu pyme sea la más rápida del sector.
                            </p>
                            <Link href="/servicios/seo" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black rounded-full font-black text-xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl">
                                Posicionamiento Web <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 -z-10" />
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 uppercase italic leading-tight tracking-tighter">
                                TAMBIÉN SOMOS <br />
                                <span className="text-emerald-400">EXPERTOS EN WORDPRESS.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                                ¿Prefieres la flexibilidad de WordPress? No hay problema. Diseñamos, mantenemos y reparamos sitios WordPress con el mismo rigor técnico que nuestras apps a medida.
                            </p>
                            <div className="grid grid-cols-2 gap-6 mb-12">
                                {[
                                    { t: "Cero Virus", d: "Limpieza y seguridad" },
                                    { t: "WPO Total", d: "Velocidad de carga" },
                                    { t: "Soporte 24/7", d: "Estamos contigo" },
                                    { t: "SEO Nativo", d: "Listo para Google" }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <span className="text-emerald-400 font-black text-sm uppercase tracking-wide">{item.t}</span>
                                        <span className="text-slate-500 text-xs font-bold uppercase">{item.d}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/servicios/sitios-web/wordpress" className="group inline-flex items-center gap-4 text-white font-black uppercase text-sm tracking-widest hover:text-emerald-400 transition-colors">
                                Ver Servicios WordPress <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </Link>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10" />
                            <div className="p-12 rounded-[3.5rem] bg-black border border-white/10 relative overflow-hidden">
                                <Code className="text-emerald-500/5 absolute -bottom-10 -right-10" size={200} />
                                <h3 className="text-3xl font-black mb-6 italic uppercase tracking-tight">Mantenimiento <br /> Preventivo</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    No esperes a que tu web deje de funcionar. Nos encargamos de que tu WordPress esté siempre actualizado, seguro y haciendo copias de seguridad cada noche.
                                </p>
                                <ul className="space-y-4">
                                    {["Actualización de Plugins segura", "Limpieza de base de datos", "Seguridad contra hackeos"].map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection items={webFAQs} title="Dudas sobre tu nueva web" />

            <MiniContactForm
                serviceName="Ingeniería Web"
                title="¿Damos el primer paso?"
                subtitle="Cuéntanos un poco sobre tu negocio y te diremos cómo podemos ayudarte a brillar en internet."
            />
        </div>
    );
}

'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Smartphone,
    Layout,
    Users,
    Zap,
    Layers,
    Code as CodeIcon,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import ProcessRoadmap from '@/app/components/ui/ProcessRoadmap';
import FAQSection from '@/app/components/ui/FAQSection';
import MiniContactForm from '@/app/components/ui/MiniContactForm';

const appSolutions = [
    {
        title: "Apps de Gestión Interna",
        desc: "Optimiza tus procesos. Control de stock, reportes de empleados, firma de partes de trabajo y CRM móvil.",
        icon: Layout,
        color: "from-emerald-500 to-teal-400",
        features: ["Firma Digital en PDF", "Modo Offline", "Sincronización en la Nube"]
    },
    {
        title: "Apps de Fidelización",
        desc: "Mantén a tus clientes cerca. Reservas directas, notificaciones push de ofertas y tarjetas de puntos digitales.",
        icon: Users,
        color: "from-cyan-500 to-blue-500",
        features: ["Notificaciones Push", "Historial de Citas", "Sistema de Cupones"]
    },
    {
        title: "PWAs (Web Apps Ligerras)",
        desc: "La solución más rentable. Se instalan sin descargar de la App Store, funcionan en cualquier móvil y son ultra-rápidas.",
        icon: Zap,
        color: "from-amber-500 to-orange-400",
        features: ["Bajo coste de desarrollo", "Sin comisiones de Stores", "Update automático"]
    }
];

const appFAQs = [
    {
        question: "¿Es muy caro desarrollar una App para mi pequeña empresa?",
        answer: "No tiene por qué. Con las PWAs (Progressive Web Apps) podemos crear una herramienta móvil potente por una fracción del coste de una App nativa, sin cuotas de mantenimiento abusivas."
    },
    {
        question: "¿Tengo que subirla a la Play Store o App Store?",
        answer: "Si optamos por una PWA, tus clientes pueden instalarla directamente desde tu web con un clic. Te ahorras los meses de espera de aprobación y las comisiones de los gigantes."
    },
    {
        question: "¿Qué pasa si mis empleados están en una zona sin cobertura?",
        answer: "Nuestras Apps de gestión están preparadas para trabajar offline. Los datos se guardan en el dispositivo y se sincronizan automáticamente en cuanto recuperan la conexión."
    }
];

export default function AppsClient() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 font-sans selection:bg-emerald-500/30">

            {/* HEADER CATEGORY */}
            <section className="relative py-20 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-white mb-8 transition-colors text-sm font-bold uppercase tracking-wider gap-2">
                        <ArrowRight className="rotate-180" size={16} /> Volver al inicio
                    </Link>

                    <div className="max-w-7xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[1.3] md:leading-tight px-4 pb-4 overflow-visible"
                        >
                            APPS ÚTILES <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 italic py-2 inline-block">PARA TU NEGOCIO.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-400 max-w-2xl leading-relaxed mb-12"
                        >
                            No creamos "juegos" ni apps de uso esporádico. Creamos herramientas de trabajo que ahorran tiempo a tus empleados y facilitan la vida a tus clientes.
                        </motion.p>
                        <div className="flex flex-wrap gap-6">
                            <Link href="#contacto" className="px-10 py-5 bg-emerald-600 text-white rounded-full font-black text-lg hover:scale-105 transition-transform shadow-xl shadow-emerald-600/20">
                                Presupuestar mi App
                            </Link>
                            <div className="flex items-center gap-3 text-slate-500 font-bold uppercase tracking-widest text-xs">
                                <ShieldCheck className="text-emerald-500" /> Desarrollo 100% en España
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOLUTIONS GRID */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8">
                        {appSolutions.map((s, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 hover:bg-white/[0.06] transition-all group flex flex-col"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-10 shadow-lg shadow-black/40 group-hover:scale-110 transition-transform`}>
                                    <s.icon className="text-white" size={32} />
                                </div>

                                <h3 className="text-2xl font-black mb-4 group-hover:text-emerald-400 transition-colors">{s.title}</h3>
                                <p className="text-slate-400 mb-10 leading-relaxed text-sm">
                                    {s.desc}
                                </p>

                                <div className="flex-grow space-y-4 mb-10">
                                    {s.features.map((f, j) => (
                                        <div key={j} className="flex items-center gap-3 text-xs text-slate-300 font-bold uppercase tracking-tighter">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                                    Explorar Solución <ArrowRight size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RENTABILIDAD SECTION */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-black mb-8">¿POR QUÉ TU PYME <br /><span className="text-emerald-500">NECESITA UNA APP?</span></h2>
                            <div className="space-y-8">
                                {[
                                    { t: "Elimina el Papel", d: "Digitaliza partes de trabajo, facturas y pedidos. Menos errores, más velocidad." },
                                    { t: "Fidelización Real", d: "Aparece en el bolsillo de tu cliente con notificaciones directas. Sin depender de algoritmos sociales." },
                                    { t: "Diferenciación", d: "Usa la tecnología para dar un servicio que tu competencia aún no imagina." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6">
                                        <span className="text-4xl font-black text-white/10">{i + 1}</span>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2">{item.t}</h4>
                                            <p className="text-slate-500">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2">
                            <div className="p-12 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/10 backdrop-blur-3xl text-center">
                                <Smartphone size={100} className="mx-auto mb-8 text-emerald-500 animate-bounce" />
                                <h3 className="text-4xl font-black mb-6">PWA: La mejor opción para Pymes</h3>
                                <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                                    Funciona como una app nativa pero se desarrolla en la mitad de tiempo. Sin esperas en Google Play o App Store. Instalación instantánea desde tu propia web.
                                </p>
                                <Link href="#contacto" className="inline-block px-10 py-5 bg-white text-black rounded-full font-black text-lg hover:scale-105 transition-transform">
                                    Saber más sobre PWAs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEW SECTIONS */}
            <ProcessRoadmap />

            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] -z-10" />
                            <div className="bg-black border border-white/10 rounded-3xl p-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Smartphone size={120} />
                                </div>
                                <h3 className="text-3xl font-black mb-6 uppercase italic">Tu App, <br />lista en tiempo récord</h3>
                                <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                                    Gracias a las PWAs, podemos entregarte una herramienta móvil lista para usar en menos de un mes. Sin procesos de revisión eternos y compatible con iOS y Android.
                                </p>
                                <div className="space-y-4">
                                    {["Cero Comisiones en Stores", "Actualizaciones Instantáneas", "Funciona Offline"].map((f, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-slate-300">
                                            <CheckCircle2 className="text-emerald-500" size={18} /> {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase italic py-4 overflow-visible">
                                DEJA EL PAPEL <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 pr-8 leading-tight inline-block">EN EL PASADO.</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                                Si tus empleados aún rellenan partes de trabajo a mano, estás perdiendo dinero. Nuestras Apps automatizan el envío de facturas, la firma digital y el control de inventario en tiempo real.
                            </p>
                            <Link href="/servicios/ia" className="inline-flex items-center gap-3 px-12 py-6 bg-white text-black rounded-full font-black text-xl hover:bg-emerald-500 hover:text-white transition-all shadow-2xl">
                                Apps con Inteligencia Artificial <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <FAQSection items={appFAQs} title="Preguntas sobre tu nueva App" />

            <MiniContactForm
                serviceName="Aplicaciones para Pymes"
                title="¿Empezamos la digitalización?"
                subtitle="Cuéntanos ese proceso que te tiene harto de usar papel y te diremos cómo podemos llevarlo a tu móvil."
            />
        </div>
    );
}

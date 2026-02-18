'use client';

import { motion } from 'framer-motion';
import {
    ShieldAlert,
    ShieldCheck,
    Search,
    FileCheck,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Lock,
    Scale
} from 'lucide-react';
import Link from 'next/link';

const risks = [
    {
        title: "Multas Elevadas",
        description: "Sanciones de hasta el 4% de la facturación anual o 20 millones de euros.",
        icon: ShieldAlert,
        color: "text-red-500"
    },
    {
        title: "Pérdida de Reputación",
        description: "Los usuarios no confían sus datos en webs que no cumplen con la privacidad.",
        icon: AlertTriangle,
        color: "text-orange-500"
    },
    {
        title: "Sanciones Legales",
        description: "Posibles demandas civiles por parte de usuarios cuyos datos hayan sido maltratados.",
        icon: Scale,
        color: "text-red-400"
    },
    {
        title: "Vulnerabilidades",
        description: "Una web no legal suele ser una web no segura técnicamente.",
        icon: Lock,
        color: "text-yellow-500"
    }
];

const steps = [
    {
        title: "Contacto Inicial",
        desc: "Analizamos tu sitio web actual y detectamos las carencias legales básicas."
    },
    {
        title: "Auditoría Exhaustiva",
        desc: "Revisamos formularios, cookies, avisos legales y flujos de datos personales."
    },
    {
        title: "Informe Detallado",
        desc: "Te entregamos un roadmap claro con los cambios necesarios o los implementamos nosotros."
    },
    {
        title: "Soporte Continuo",
        desc: "Nos aseguramos de que sigas cumpliendo ante cambios en la normativa (GDPR/CCPA)."
    }
];

import { useState } from 'react';

export default function LegalClient() {
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8"
                    >
                        <ShieldCheck size={14} /> Tu Web Segura y 100% Legal
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight"
                    >
                        Auditoría Experta para <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Cumplir con RGPD y LSSI</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-3xl mx-auto mb-12"
                    >
                        Evita sanciones millonarias y protege la privacidad de tus usuarios con una implementación legal profesional y técnica de tu sitio web.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <a href="#contacto" className="px-10 py-5 bg-emerald-500 text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            Auditoría Gratis Ahora
                        </a>
                        <Link href="/servicios/sitios-web" className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                            Ver Servicios Web
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* RISKS SECTION */}
            <section className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">¿Es tu Web 100% Legal?</h2>
                        <p className="text-slate-400">No cumplir con la normativa pone en riesgo tu negocio y tu bolsillo.</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {risks.map((risk, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-black border border-white/10 hover:border-red-500/30 transition-all"
                            >
                                <risk.icon className={`${risk.color} mb-6`} size={40} />
                                <h3 className="text-xl font-bold mb-3">{risk.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{risk.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PROCESS SECTION */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-20">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-black mb-8">Nuestro Sencillo <br /><span className="text-emerald-500">Proceso de Auditoría</span></h2>
                            <div className="space-y-12">
                                {steps.map((step, i) => (
                                    <div key={i} className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full border border-emerald-500/50 flex items-center justify-center text-emerald-500 font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 text-white">{step.title}</h4>
                                            <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 backdrop-blur-xl">
                                <h3 className="text-2xl font-black mb-6">Beneficios Inmediatos</h3>
                                <ul className="space-y-6">
                                    {[
                                        "Cumplimiento garantizado ante la AEPD.",
                                        "Protección de datos de primer nivel.",
                                        "Mejora radical de la reputación corporativa.",
                                        "Tranquilidad total para centrarte en tu negocio.",
                                        "Ahorro de costes legales a largo plazo."
                                    ].map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-4">
                                            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={24} />
                                            <span className="text-lg text-slate-200">{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* Decorative particles for consistency */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION - LEAD CAPTURE FORM */}
            <section className="py-32 bg-emerald-500" id="contacto">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tighter">
                            ¿Es tu web segura? <br />
                            <span className="opacity-70">Lo comprobamos gratis.</span>
                        </h2>
                        <p className="text-black/60 font-medium text-lg max-w-2xl mx-auto">
                            Déjanos tus datos y realizaremos un análisis rápido de tu nivel de cumplimiento legal actual sin coste alguno.
                        </p>
                    </div>

                    <div className="bg-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!privacyAccepted) return;
                                const form = e.currentTarget;
                                const formData = new FormData(form);
                                formData.append('_subject', 'LEAD RGPD - Comprobación');
                                try {
                                    const res = await fetch('/send-mail.php', {
                                        method: 'POST',
                                        body: formData
                                    });
                                    if (res.ok) {
                                        alert('¡Solicitud recibida! Analizaremos tu web y te enviaremos el informe pronto.');
                                        form.reset();
                                        setPrivacyAccepted(false);
                                    } else {
                                        alert('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
                                    }
                                } catch (err) {
                                    alert('Error de conexión con el servidor.');
                                }
                            }}
                            className="space-y-6 relative z-10"
                        >
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre Completo</label>
                                    <input name="name" type="text" required placeholder="Tu nombre" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email Corporativo</label>
                                    <input name="email" type="email" required placeholder="tu@email.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">URL de tu Sitio Web</label>
                                <input name="website" type="url" required placeholder="https://tuweb.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        id="privacy-legal"
                                        name="privacy"
                                        type="checkbox"
                                        required
                                        checked={privacyAccepted}
                                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-white/10 bg-black/40 text-emerald-500 focus:ring-emerald-500 transition-colors cursor-pointer"
                                    />
                                    <label htmlFor="privacy-legal" className="text-xs text-slate-400 leading-tight cursor-pointer select-none">
                                        He leído y acepto la <Link href="/legal/privacidad/" className="text-emerald-500 hover:underline">Política de Privacidad</Link>.
                                    </label>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-slate-500 leading-relaxed italic">
                                    <p><strong>Información Básica:</strong> <strong>Responsable:</strong> Linea digital norte, s.l. | <strong>Finalidad:</strong> Auditoría legal gratuita. | <strong>Legitimación:</strong> Consentimiento. | <strong>Derechos:</strong> web@d-seo.es.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!privacyAccepted}
                                    className={`w-full py-5 bg-emerald-500 text-black rounded-2xl font-black text-xl uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-3 ${!privacyAccepted ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white hover:scale-[1.01]'}`}
                                >
                                    Solicitar Análisis Gratuito <CheckCircle2 size={24} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

        </div>
    );
}

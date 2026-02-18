'use client';

import { ShieldCheck, Lock, FileText, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LegalSection() {
    return (
        <section className="py-20 bg-white/[0.02] border-y border-white/5">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase mb-6">
                        <ShieldCheck size={14} /> Cumplimiento Normativo
                    </div>
                    <h2 className="text-4xl font-black text-white mb-6">
                        Tu Web, Blindada Legalmente.
                    </h2>
                    <p className="text-slate-400 text-lg mb-8">
                        Evita multas y gana la confianza de tus clientes. Ofrecemos auditoría completa de RGPD, LSSI y seguridad técnica.
                    </p>
                    <ul className="space-y-4 mb-10">
                        {[
                            "Textos legales personalizados (no plantillas genéricas)",
                            "Gestión de Cookies y Consentimiento (CMP)",
                            "Auditoría de Seguridad y SSL",
                            "Protocolos de privacidad de datos"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-slate-300 transform hover:translate-x-1 transition-transform">
                                <Check size={18} className="text-emerald-500 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <Link href="/servicios/sitios-web/legal/" className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 text-black rounded-full font-black text-sm uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-emerald-500/10 group">
                        Analizar mi Cumplimiento <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                <div className="flex-1 relative">
                    <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Auditoría Aprobada</h3>
                                <p className="text-sm text-gray-500">RGPD & LSSI-CE</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-emerald-500" />
                            </div>
                            <p className="text-xs text-center text-gray-400 font-mono">CERTIFICADO VALIDO 2024-2025</p>
                        </div>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-10 right-10 w-full h-full bg-emerald-500/20 rounded-2xl -z-10 blur-xl"></div>
                </div>
            </div>
        </section>
    );
}

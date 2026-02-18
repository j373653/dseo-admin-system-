'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function Privacidad() {
    return (
        <div className="min-h-screen bg-black text-slate-300 pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl bg-white/[0.02] border border-white/10 p-12 rounded-3xl">
                <div className="flex items-center gap-4 mb-8 text-white">
                    <Lock className="text-cyan-500" size={32} />
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Privacidad & RGPD</h1>
                </div>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">¿Quién es el responsable del tratamiento de tus datos?</h2>
                        <p>
                            <strong>Titular:</strong> Linea digital norte, s.l.<br />
                            <strong>NIF:</strong> B31801350<br />
                            <strong>Email:</strong> web@d-seo.es
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">¿Con qué finalidad tratamos tus datos personales?</h2>
                        <p>
                            En D-SEO tratamos la información que nos facilitan las personas interesadas con las siguientes finalidades:<br /><br />
                            1. Gestionar el envío de la información que nos soliciten.<br />
                            2. Facilitar ofertas de productos y servicios de su interés.<br />
                            3. Enviar comunicaciones comerciales y newsletters informativas sobre marketing digital y tecnología (siempre con consentimiento explícito).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">¿Por cuánto tiempo conservaremos tus datos?</h2>
                        <p>Los datos personales proporcionados se conservarán mientras se mantenga la relación comercial o no se solicite su supresión por el interesado durante un plazo de 5 años desde la última interacción.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}

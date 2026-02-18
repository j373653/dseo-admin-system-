'use client';

import { motion } from 'framer-motion';
import { Network, Database, Lock, Code } from 'lucide-react';

export default function CustomSolutions() {
    return (
        <section className="py-24 bg-black relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Soluciones a Medida</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Cuando el software estándar no es suficiente. Desarrollamos integraciones profundas con las APIs de IA más potentes del mercado.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <motion.div whileHover={{ y: -5 }} className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10">
                        <Network className="text-blue-400 mb-6" size={40} />
                        <h3 className="text-2xl font-bold text-white mb-4">Sistemas Conectados</h3>
                        <p className="text-slate-400">Conectamos tu CRM, WhatsApp y correo para que todos tus sistemas fluyan sin que tengas que copiar y pegar datos manualmente.</p>
                    </motion.div>
                    <motion.div whileHover={{ y: -5 }} className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10">
                        <Database className="text-emerald-400 mb-6" size={40} />
                        <h3 className="text-2xl font-bold text-white mb-4">IA con "Tus Reglas"</h3>
                        <p className="text-slate-400">Entrenamos a la IA con el conocimiento específico de tu negocio, para que responda exactamente como tú lo harías.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

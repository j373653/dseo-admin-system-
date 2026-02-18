'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { RefreshCw, CheckCircle2, Zap } from 'lucide-react';

export default function IAShowcase() {
    const [step, setStep] = useState(0);

    const automatedSteps = [
        { title: "Llega WhatsApp de Cliente", status: "Analizando intención...", color: "bg-blue-500" },
        { title: "IA entiende la consulta", status: "Consultando tu stock/agenda...", color: "bg-purple-500" },
        { title: "Reserva Confirmada", status: "Actualizando tu sistema...", color: "bg-pink-500" },
        { title: "Notificación Enviada", status: "Cliente satisfecho", color: "bg-green-500" }
    ];

    const runSimulation = () => {
        setStep(0);
        let current = 0;
        const interval = setInterval(() => {
            current++;
            setStep(current);
            if (current >= 4) clearInterval(interval);
        }, 800);
    };

    return (
        <section className="py-24 bg-black relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

            <div className="container mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase mb-6">
                        <Zap size={14} /> Automatización Inteligente
                    </div>
                    <h2 className="text-5xl font-black text-white mb-6">
                        El trabajo de 10 personas, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">en 1 segundo.</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        Nuestros agentes de IA no solo responden chats. Ejecutan tareas complejas, se integran con tu CRM y toman decisiones basadas en tus reglas de negocio.
                    </p>
                    <button
                        onClick={runSimulation}
                        className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <RefreshCw size={20} className={step > 0 && step < 4 ? "animate-spin" : ""} /> Simular Automatización
                    </button>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <div className="space-y-6">
                        {automatedSteps.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0.5, x: -20 }}
                                animate={{
                                    opacity: i < step ? 1 : 0.3,
                                    x: i < step ? 0 : -20,
                                    scale: i === step - 1 ? 1.05 : 1
                                }}
                                className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 ${i < step ? 'bg-white/10' : 'bg-transparent'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i < step ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                    {i < step ? <CheckCircle2 size={20} /> : <div className="text-xs font-bold">{i + 1}</div>}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${i < step ? 'text-white' : 'text-slate-300'}`}>{s.title}</h3>
                                    {i === step && <span className="text-xs text-purple-400 animate-pulse">{s.status}</span>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

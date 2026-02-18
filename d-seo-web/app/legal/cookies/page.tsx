'use client';

import { motion } from 'framer-motion';
import { Cookie } from 'lucide-react';

export default function Cookies() {
    return (
        <div className="min-h-screen bg-black text-slate-300 pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl bg-white/[0.02] border border-white/10 p-12 rounded-3xl">
                <div className="flex items-center gap-4 mb-8 text-white">
                    <Cookie className="text-cyan-500" size={32} />
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Política de Cookies</h1>
                </div>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">¿Qué son las cookies?</h2>
                        <p>Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Tipos de cookies que utiliza este sitio web</h2>
                        <ul className="list-disc pl-6 space-y-4">
                            <li><strong>Cookies técnicas:</strong> Esenciales para el funcionamiento del sitio y para recordar tus preferencias de privacidad.</li>
                            <li><strong>Cookies de análisis (Google Analytics):</strong> Nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen los usuarios del servicio ofertado.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">¿Cómo desactivar las cookies?</h2>
                        <p>Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones del navegador que utilices en tu ordenador.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}

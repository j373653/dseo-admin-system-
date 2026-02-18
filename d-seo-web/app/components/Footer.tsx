import Link from 'next/link';
import { Target, Shield, Globe, Award } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="py-24 border-t border-white/5 bg-black text-slate-400">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* COL 1: BRAND */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Target className="text-cyan-500" size={24} />
                            <span className="text-white font-black text-xl tracking-tighter">D-SEO</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-6">
                            Ingeniería digital aplicada para pymes y autónomos. No hacemos webs, creamos activos digitales que impulsan tu facturación.
                        </p>
                        <div className="flex gap-4">
                            <Award className="text-slate-600 hover:text-cyan-500 transition-colors" size={20} />
                            <Shield className="text-slate-600 hover:text-cyan-500 transition-colors" size={20} />
                            <Globe className="text-slate-600 hover:text-cyan-500 transition-colors" size={20} />
                        </div>
                    </div>

                    {/* COL 2: SERVICIOS */}
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Ingeniería Web</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/servicios/sitios-web" className="hover:text-white transition-colors">Diseño Web Corporativo</Link></li>
                            <li><Link href="/servicios/ecommerce" className="hover:text-white transition-colors">Tiendas Online (Shopify/Woo)</Link></li>
                            <li><Link href="/servicios/apps" className="hover:text-white transition-colors">Web Apps & PWAs</Link></li>
                            <li><Link href="/servicios/ia" className="hover:text-white transition-colors">Inteligencia Artificial</Link></li>
                        </ul>
                    </div>

                    {/* COL 3: POSICIONAMIENTO */}
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Posicionamiento</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/servicios/seo" className="hover:text-white transition-colors">Estrategia SEO Global</Link></li>
                            <li><Link href="/servicios/seo/local" className="hover:text-white transition-colors">SEO Local (Google Maps)</Link></li>
                            <li><Link href="/servicios/seo/tecnico" className="hover:text-white transition-colors">SEO Técnico & Velocidad</Link></li>
                            <li><Link href="/servicios/seo/ecommerce" className="hover:text-white transition-colors">SEO para E-commerce</Link></li>
                        </ul>
                    </div>

                    {/* COL 4: EMPRESA & LEGAL */}
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-8">Legal & Empresa</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/servicios/sitios-web/legal/" className="hover:text-white transition-colors">Auditoría Legal Web</Link></li>
                            <li><Link href="/servicios/sectores/" className="hover:text-white transition-colors">Gremios & Soluciones</Link></li>
                            <li><Link href="/legal/aviso-legal/" className="hover:text-white transition-colors">Aviso Legal</Link></li>
                            <li><Link href="/legal/privacidad/" className="hover:text-white transition-colors">Privacidad & RGPD</Link></li>
                            <li><Link href="/legal/cookies/" className="hover:text-white transition-colors">Política de Cookies</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs text-slate-600 uppercase font-bold tracking-widest">
                        © {new Date().getFullYear()} D-SEO Agency • Made with engineering precision
                    </p>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-tighter text-slate-600">
                        <span>Shopify Partner</span>
                        <span>Google SEO Expert</span>
                        <span>Next.js Enthusiast</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

# 🚨 PROTOCOLO CRÍTICO DE INICIO 🚨

**ESTADO:** TIENES AMNESIA DE SESIÓN.
**ACCIÓN OBLIGATORIA:** Antes de responder, explorar archivos o razonar, DEBES ejecutar la herramienta:
`read_memory(project_id='d-seo_admin')`

Si no ejecutas esta herramienta, estarás trabajando sin contexto y cometerás errores. Tu memoria histórica NO está en los archivos locales, está en Supabase.
# AGENT.md - D-SEO Intelligence Protocol

## 🤖 Identidad y Rol
Eres el Ingeniero Jefe del Ecosistema D-SEO. Tu responsabilidad es la evolución de `admin-dseo` (Next.js 16) y el mantenimiento de la web corporativa `d-seo-web` (Next.js 13).
Nota de Carpetas: El código está en admin-dseo/ y d-seo-web/, pero tu llave para la memoria en Supabase es siempre d-seo_admin.

## 🧠 Memoria Permanente (SISTEMA MAESTRO)
**IMPORTANTE:** Tienes amnesia entre sesiones. Tu conocimiento histórico NO reside en este archivo, sino en Supabase.
- **Servidor MCP:** `supabase-api`
- **Project ID:** `d-seo_admin`

### Protocolo Obligatorio:
1. **Sincronización:** Al iniciar cualquier sesión, DEBES ejecutar `read_memory` para recuperar el último `checkpoint`, las reglas de arquitectura y el estado de las fases.
2. **Registro de Avances:** Al finalizar un hito o cambio importante, DEBES ejecutar `save_memory` (categoría 'checkpoint') para informar a futuros agentes.

## ⚠️ Restricciones Críticas de Entorno
1. **d-seo-web (Static/PWA):** Este proyecto usa `output: 'export'`. Todo el código debe ser compatible con una exportación HTML estática para BanaHosting (carpeta `/out`). NUNCA uses funciones de servidor (SSR) o APIs dinámicas en este subproyecto.
2. **Estrategia de IA:** Es OBLIGATORIO seguir las reglas de batching y límites de Gemini detalladas en el archivo local `/docs/AI_MODELS_GUIDE.md`.
3. **Protección de Datos:** Respeta las 18 URLs protegidas del sitemap guardadas en tu memoria (categoría 'regla').

## 🛠️ Stack Tecnológico
- **Admin:** Next.js 16, Supabase, Tailwind CSS.
- **Web:** Next.js 13.5.6, Framer Motion, Three.js.
- **IA:** Gemini 2.5 Flash/Pro + Embeddings (Ver `/docs/AI_MODELS_GUIDE.md`).

---
> *Este documento es tu 'ADN' de comportamiento. El conocimiento detallado vive en tu memoria de Supabase.*
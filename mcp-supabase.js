const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

const SUPABASE_URL = "https://supabase.keepmyweb.com";
const ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoiYW5vbiJ9.ty_4ID3zyHi69YoT4FR_wGOb430r-SFs5GzeRb1qVhc";

const server = new Server({ name: "supabase-memory", version: "1.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { 
      name: "save_memory_scoped", 
      description: "Guarda un recuerdo en un tema específico", 
      inputSchema: { 
        type: "object", 
        properties: { 
          project_id: { type: "string" }, 
          category: { type: "string" }, 
          content: { type: "string" },
          scope: { type: "string", description: "Tema o módulo (ej: 'bombones', 'auth', 'global')" } 
        },
        required: ["project_id", "category", "content"]
      } 
    },
    { 
      name: "read_memory_scoped", 
      description: "Lee recuerdos de un tema específico y los globales", 
      inputSchema: { 
        type: "object", 
        properties: { 
          project_id: { type: "string" },
          scope: { type: "string", description: "Tema específico a recuperar. Si no se pone, trae el global." }
        },
        required: ["project_id"]
      } 
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const scope = args.scope || 'global';

  if (name === "save_memory_scoped") {
    console.log('[save_memory_scoped] Args:', JSON.stringify(args));
    console.log('[save_memory_scoped] Scope:', scope);
    
    try {
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
        method: 'POST',
        headers: { 
          'apikey': ANON_KEY, 
          'Authorization': `Bearer ${ANON_KEY}`, 
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          project_id: args.project_id, 
          category: args.category, 
          content: args.content,
          scope: scope
        })
      });
      
      console.log('[save_memory_scoped] Status:', saveResponse.status);
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('[save_memory_scoped] Error:', errorText);
        return { content: [{ type: "text", text: `❌ Error guardando: ${saveResponse.status} - ${errorText}` }] };
      }
      
      return { content: [{ type: "text", text: `✅ Guardado en tema: ${scope} (project: ${args.project_id})` }] };
    } catch (err) {
      console.error('[save_memory_scoped] Exception:', err);
      return { content: [{ type: "text", text: `❌ Error: ${err.message}` }] };
    }
  }

  if (name === "read_memory_scoped") {
    // Buscamos lo específico del tema Y lo global (reglas de oro)
    const filter = args.scope 
      ? `project_id=eq.${args.project_id}&or=(scope.eq.${args.scope},scope.eq.global)`
      : `project_id=eq.${args.project_id}&scope=eq.global`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/memories?${filter}&order=created_at.desc&limit=15`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);

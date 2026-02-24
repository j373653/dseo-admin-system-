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
    await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...args, scope })
    });
    return { content: [{ type: "text", text: `✅ Guardado en tema: ${scope}` }] };
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

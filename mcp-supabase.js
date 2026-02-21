const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");

const SUPABASE_URL = "https://supabase.keepmyweb.com";
const ANON_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDUwMzgyMCwiZXhwIjo0OTI2MTc3NDIwLCJyb2xlIjoiYW5vbiJ9.ty_4ID3zyHi69YoT4FR_wGOb430r-SFs5GzeRb1qVhc";

const server = new Server({ name: "supabase-memory", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "save_memory", description: "Guarda un recuerdo", inputSchema: { type: "object", properties: { project_id: { type: "string" }, category: { type: "string" }, content: { type: "string" } } } },
    { name: "read_memory", description: "Lee recuerdos", inputSchema: { type: "object", properties: { project_id: { type: "string" } } } }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "save_memory") {
    await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    return { content: [{ type: "text", text: "✅ Guardado" }] };
  }
  if (name === "read_memory") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/memories?project_id=eq.${args.project_id}&order=created_at.desc&limit=10`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    });
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Tool schemas (MCP definitions)
import { setupNotionSchema, handleSetupNotion } from "./tools/setupNotion.js";
import { parseProfileSchema, handleParseProfile } from "./tools/parseProfile.js";
import { findEmailSchema, handleFindEmail } from "./tools/findEmail.js";
import { researchCompanySchema, handleResearchCompany } from "./tools/researchCompany.js";
import { generateEmailSchema, handleGenerateEmail } from "./tools/generateEmail.js";
import { sendEmailSchema, handleSendEmail } from "./tools/sendEmail.js";
import { bulkOutreachSchema, handleBulkOutreach } from "./tools/bulkOutreach.js";
import { discoverCompaniesSchema, handleDiscoverCompanies } from "./tools/discoverCompanies.js";
import { logToNotionSchema, handleLogToNotion } from "./tools/logToNotion.js";
import { retryFailedSchema, handleRetryFailed } from "./tools/retryFailed.js";

// All registered tools in one place
const TOOLS = [
  setupNotionSchema,
  parseProfileSchema,
  findEmailSchema,
  researchCompanySchema,
  generateEmailSchema,
  sendEmailSchema,
  discoverCompaniesSchema,
  bulkOutreachSchema,
  logToNotionSchema,
  retryFailedSchema,
];

// ─── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: "cold-outreach-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Returns the list of available tools to the MCP client
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Dispatches tool calls to the appropriate handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  let result: string;

  try {
    switch (name) {
      case "setup_notion_db":
        result = await handleSetupNotion();
        break;

      case "parse_profile":
        result = await handleParseProfile(args as { input: string });
        break;

      case "find_company_email":
        result = await handleFindEmail(args as { website_url: string });
        break;

      case "research_company":
        result = await handleResearchCompany(args as { website_url: string });
        break;

      case "generate_email":
        result = await handleGenerateEmail(args as any);
        break;

      case "send_email":
        result = await handleSendEmail(args as { to: string; subject: string; body: string });
        break;

      case "discover_companies":
        result = await handleDiscoverCompanies(args as any);
        break;

      case "bulk_outreach":
        result = await handleBulkOutreach(args as any);
        break;

      case "log_to_notion":
        result = await handleLogToNotion(args as any);
        break;

      case "retry_failed":
        result = await handleRetryFailed(args as { subject?: string; body?: string });
        break;

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mcp] Tool "${name}" threw an error:`, message);
    return {
      content: [{ type: "text", text: JSON.stringify({ success: false, error: message }) }],
      isError: true,
    };
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cold-outreach-mcp] Server running on stdio");
}

main().catch((err) => {
  console.error("[cold-outreach-mcp] Fatal error:", err);
  process.exit(1);
});

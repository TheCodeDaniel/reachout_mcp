import { setupDatabase } from "../services/notion.js";

// Input schema for the MCP tool definition
export const setupNotionSchema = {
  name: "setup_notion_db",
  description:
    "Creates the Cold Outreach Tracker database in Notion. Run this once. After running, copy the returned database ID into NOTION_DATABASE_ID in your .env file.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

// Tool handler — called by the MCP server when Claude invokes this tool
export async function handleSetupNotion(): Promise<string> {
  const dbId = await setupDatabase();
  return JSON.stringify({
    success: true,
    database_id: dbId,
    message: `Database created! Add this to your .env: NOTION_DATABASE_ID=${dbId}`,
  });
}

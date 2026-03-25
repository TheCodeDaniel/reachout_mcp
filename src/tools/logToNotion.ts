import { logRecord } from "../services/notion.js";
import type { OutreachRecord } from "../types/index.js";

export const logToNotionSchema = {
  name: "log_to_notion",
  description: "Logs a completed (or failed) outreach attempt to the Notion database.",
  inputSchema: {
    type: "object",
    properties: {
      company: { type: "string", description: "Company name" },
      website: { type: "string", description: "Company website URL" },
      email: { type: "string", description: "Email address that was used" },
      type: {
        type: "string",
        enum: ["opportunity_pitch", "role_inquiry"],
      },
      status: {
        type: "string",
        enum: ["pending", "sent", "failed", "replied"],
      },
      dateSent: {
        type: "string",
        description: "ISO date string (e.g. 2025-03-25)",
      },
      notes: {
        type: "string",
        description: "Any extra notes or error messages",
      },
    },
    required: ["company", "website", "email", "type", "status"],
  },
};

export async function handleLogToNotion(args: OutreachRecord): Promise<string> {
  const pageId = await logRecord(args);
  return JSON.stringify({ success: true, notion_page_id: pageId });
}

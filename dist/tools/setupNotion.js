import { setupDatabase } from "../services/notion.js";
export const setupNotionSchema = {
    name: "setup_notion_db",
    description: "Migrates your Notion database — creates all required columns (Company, Website, Email, Type, Status, Date Sent, Notes). Run this once after adding NOTION_DATABASE_ID to your .env. Safe to call again.",
    inputSchema: {
        type: "object",
        properties: {},
        required: [],
    },
};
export async function handleSetupNotion() {
    const dbId = await setupDatabase();
    return JSON.stringify({
        success: true,
        database_id: dbId,
        message: "Database columns created. You're ready to start outreach.",
    });
}
//# sourceMappingURL=setupNotion.js.map
import { setupDatabase } from "../services/notion.js";
export const setupNotionSchema = {
    name: "setup_notion_db",
    description: "Creates the Cold Outreach Tracker database in a Notion page you specify. Run this once. After running, copy the returned database_id into NOTION_DATABASE_ID in your .env file. Safe to call again — will detect if a database already exists.",
    inputSchema: {
        type: "object",
        properties: {
            parent_page_id: {
                type: "string",
                description: "The Notion page ID where the database will be created. Open any Notion page, copy the URL — the ID is the last part (e.g. https://notion.so/My-Page-abc123def456 → abc123def456).",
            },
        },
        required: ["parent_page_id"],
    },
};
export async function handleSetupNotion(args) {
    const result = await setupDatabase(args.parent_page_id);
    // setupDatabase returns either a plain ID string or a JSON object string (idempotency path)
    try {
        // If it parses as JSON, it's the "already exists" response — return as-is
        JSON.parse(result);
        return result;
    }
    catch {
        // It's a plain ID string — new database was created
        return JSON.stringify({
            success: true,
            database_id: result,
            message: `Database created! Add this to your .env:\nNOTION_DATABASE_ID=${result}`,
        });
    }
}
//# sourceMappingURL=setupNotion.js.map
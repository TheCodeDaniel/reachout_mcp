import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
const notion = new Client({ auth: env.notionApiKey });
const NOTION_VERSION = "2022-06-28";
// Migrates the database at NOTION_DATABASE_ID — adds all required columns.
// Uses raw fetch (same pattern as the Notion API directly) for reliability.
// Safe to call again — idempotent.
export async function setupDatabase() {
    const dbId = env.notionDatabaseId;
    const apiKey = env.notionApiKey;
    if (!dbId) {
        throw new Error("NOTION_DATABASE_ID is not set. Create a database on Notion, copy its ID from the URL, and add it to your .env and Claude Desktop config.");
    }
    // ── Step 1: Verify the database exists and the integration can access it ──
    const checkRes = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": NOTION_VERSION,
        },
    });
    if (!checkRes.ok) {
        const err = await checkRes.text();
        throw new Error(`Cannot access Notion database (${checkRes.status}): ${err}.\n` +
            `Check that NOTION_DATABASE_ID is correct and your integration is connected to the database ` +
            `(open the database in Notion → ... → Connections → Connect to your integration).`);
    }
    // ── Step 2: PATCH the database to add/ensure all required columns ──
    // "Name" is the default title column Notion creates — rename it to "Company".
    // All other properties are added fresh. Safe to run again (idempotent).
    const migrateRes = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": NOTION_VERSION,
        },
        body: JSON.stringify({
            properties: {
                Name: { name: "Company", title: {} }, // rename default title col → Company
                Website: { url: {} },
                Email: { email: {} },
                Type: {
                    select: {
                        options: [
                            { name: "opportunity_pitch", color: "blue" },
                            { name: "role_inquiry", color: "green" },
                        ],
                    },
                },
                Status: {
                    select: {
                        options: [
                            { name: "pending", color: "yellow" },
                            { name: "sent", color: "green" },
                            { name: "failed", color: "red" },
                            { name: "replied", color: "purple" },
                        ],
                    },
                },
                "Date Sent": { date: {} },
                Notes: { rich_text: {} },
            },
        }),
    });
    if (!migrateRes.ok) {
        const err = await migrateRes.text();
        throw new Error(`Notion migration failed (${migrateRes.status}): ${err}`);
    }
    return dbId;
}
// Logs a single outreach record to Notion.
// emailBody (if provided) is appended to Notes so nothing is silently dropped.
export async function logRecord(record) {
    const dbId = env.notionDatabaseId;
    if (!dbId)
        throw new Error("NOTION_DATABASE_ID is not set in .env");
    // Combine notes + email body into one Notes field
    const notesContent = [record.notes, record.emailBody ? `\n---\n${record.emailBody}` : ""]
        .filter(Boolean)
        .join("")
        .slice(0, 2000); // Notion rich_text limit
    const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
            Company: {
                title: [{ text: { content: record.company } }],
            },
            // Notion URL properties reject empty strings — use null if missing
            Website: { url: record.website || null },
            Email: { email: record.email || null },
            Type: { select: { name: record.type } },
            Status: { select: { name: record.status } },
            "Date Sent": record.dateSent
                ? { date: { start: record.dateSent } }
                : { date: null },
            Notes: {
                rich_text: [{ text: { content: notesContent } }],
            },
        },
    });
    return response.id;
}
// Updates the status field of an existing Notion page
export async function updateStatus(pageId, status) {
    await notion.pages.update({
        page_id: pageId,
        properties: {
            Status: { select: { name: status } },
        },
    });
}
// Returns all outreach records marked as "failed" — used by retry_failed
export async function getFailedRecords() {
    const dbId = env.notionDatabaseId;
    if (!dbId)
        throw new Error("NOTION_DATABASE_ID is not set in .env");
    const response = await notion.databases.query({
        database_id: dbId,
        filter: { property: "Status", select: { equals: "failed" } },
    });
    return response.results.map((page) => {
        const props = page.properties;
        return {
            pageId: page.id,
            record: {
                company: props.Company?.title?.[0]?.text?.content ?? "",
                website: props.Website?.url ?? "",
                email: props.Email?.email ?? "",
                type: props.Type?.select?.name ?? "role_inquiry",
                status: "failed",
                notes: props.Notes?.rich_text?.[0]?.text?.content ?? "",
            },
        };
    });
}
//# sourceMappingURL=notion.js.map
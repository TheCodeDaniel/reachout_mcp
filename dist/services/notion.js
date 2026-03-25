import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
const notion = new Client({ auth: env.notionApiKey });
// Creates the outreach tracking database under a given parent page.
// parentPageId is passed as a tool argument — not stored in .env.
// After running, copy the returned ID into NOTION_DATABASE_ID in .env.
export async function setupDatabase(parentPageId) {
    // Idempotency: if a database ID is already configured, verify it's still valid
    if (env.notionDatabaseId) {
        try {
            const existing = await notion.databases.retrieve({ database_id: env.notionDatabaseId });
            return JSON.stringify({
                already_exists: true,
                database_id: env.notionDatabaseId,
                message: "Database already configured — no action taken.",
                database_title: existing.title?.[0]?.plain_text ?? "Unknown",
            });
        }
        catch {
            // ID exists in env but is invalid/inaccessible — fall through and create a new one
        }
    }
    const response = await notion.databases.create({
        parent: { type: "page_id", page_id: parentPageId },
        title: [{ type: "text", text: { content: "Cold Outreach Tracker" } }],
        properties: {
            Company: { title: {} },
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
    });
    return response.id;
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
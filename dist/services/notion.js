import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
const notion = new Client({ auth: env.notionApiKey });
// Creates the outreach tracking database under a given parent page.
// Call this once via the setup_notion_db tool — then put the returned ID in .env
export async function setupDatabase() {
    if (!env.notionParentPageId) {
        throw new Error("NOTION_PARENT_PAGE_ID is required to create the database");
    }
    const response = await notion.databases.create({
        parent: { type: "page_id", page_id: env.notionParentPageId },
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
// Logs a single outreach record to Notion
export async function logRecord(record) {
    const dbId = env.notionDatabaseId;
    if (!dbId)
        throw new Error("NOTION_DATABASE_ID is not set");
    const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
            Company: {
                title: [{ text: { content: record.company } }],
            },
            Website: { url: record.website || null },
            Email: { email: record.email || null },
            Type: {
                select: { name: record.type },
            },
            Status: {
                select: { name: record.status },
            },
            "Date Sent": record.dateSent
                ? { date: { start: record.dateSent } }
                : { date: null },
            Notes: {
                rich_text: [{ text: { content: record.notes ?? "" } }],
            },
        },
    });
    return response.id;
}
// Updates the status of an existing Notion page
export async function updateStatus(pageId, status) {
    await notion.pages.update({
        page_id: pageId,
        properties: {
            Status: { select: { name: status } },
        },
    });
}
// Returns all outreach records that have status "failed"
// Used by the retry_failed tool
export async function getFailedRecords() {
    const dbId = env.notionDatabaseId;
    if (!dbId)
        throw new Error("NOTION_DATABASE_ID is not set");
    const response = await notion.databases.query({
        database_id: dbId,
        filter: {
            property: "Status",
            select: { equals: "failed" },
        },
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
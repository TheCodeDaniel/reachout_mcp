import { Client } from "@notionhq/client";
import { env } from "../config/env.js";
import type { OutreachRecord, OutreachStatus } from "../types/index.js";

const notion = new Client({ auth: env.notionApiKey });

// Migrates the database at NOTION_DATABASE_ID — adds all required columns.
// You create the database on Notion yourself, paste its ID into .env,
// then call this once to set up the columns. Safe to call again (idempotent).
export async function setupDatabase(): Promise<string> {
  const dbId = env.notionDatabaseId;
  if (!dbId) throw new Error("NOTION_DATABASE_ID is not set in .env — create a database on Notion, copy its ID, and add it to .env first.");

  await notion.databases.update({
    database_id: dbId,
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

  return dbId;
}

// Logs a single outreach record to Notion.
// emailBody (if provided) is appended to Notes so nothing is silently dropped.
export async function logRecord(record: OutreachRecord): Promise<string> {
  const dbId = env.notionDatabaseId;
  if (!dbId) throw new Error("NOTION_DATABASE_ID is not set in .env");

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
export async function updateStatus(pageId: string, status: OutreachStatus): Promise<void> {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: status } },
    },
  });
}

// Returns all outreach records marked as "failed" — used by retry_failed
export async function getFailedRecords(): Promise<
  Array<{ pageId: string; record: OutreachRecord }>
> {
  const dbId = env.notionDatabaseId;
  if (!dbId) throw new Error("NOTION_DATABASE_ID is not set in .env");

  const response = await notion.databases.query({
    database_id: dbId,
    filter: { property: "Status", select: { equals: "failed" } },
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    return {
      pageId: page.id as string,
      record: {
        company: props.Company?.title?.[0]?.text?.content ?? "",
        website: props.Website?.url ?? "",
        email: props.Email?.email ?? "",
        type: props.Type?.select?.name ?? "role_inquiry",
        status: "failed" as OutreachStatus,
        notes: props.Notes?.rich_text?.[0]?.text?.content ?? "",
      } as OutreachRecord,
    };
  });
}

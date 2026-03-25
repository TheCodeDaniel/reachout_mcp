import { getFailedRecords, updateStatus } from "../services/notion.js";
import { sendEmail, BULK_SEND_DELAY_MS } from "../services/email.js";
// How many times we've already tried doesn't need to be tracked here —
// the Notion "Notes" field captures previous failure reasons,
// and we limit retries to 2 per session.
const MAX_RETRY_PER_SESSION = 2;
export const retryFailedSchema = {
    name: "retry_failed",
    description: "Finds all outreach records marked as 'failed' in Notion and re-sends the emails. Updates status to 'sent' or keeps 'failed' with updated notes.",
    inputSchema: {
        type: "object",
        properties: {
            subject: {
                type: "string",
                description: "Subject line to use when re-sending (optional — useful if you changed it)",
            },
            body: {
                type: "string",
                description: "Email body to use when re-sending (optional — leave out to skip re-sending and just list failures)",
            },
        },
        required: [],
    },
};
export async function handleRetryFailed(args) {
    const failed = await getFailedRecords();
    if (failed.length === 0) {
        return JSON.stringify({ success: true, message: "No failed records found." });
    }
    const results = [];
    const toRetry = failed.slice(0, MAX_RETRY_PER_SESSION);
    for (const { pageId, record } of toRetry) {
        // If no body was given, just list the failures without resending
        if (!args.body || !args.subject) {
            results.push({
                company: record.company,
                email: record.email,
                result: "skipped — no email body/subject provided",
            });
            continue;
        }
        console.log(`[retry] Retrying ${record.company} (${record.email})...`);
        const sendResult = await sendEmail(record.email, args.subject, args.body);
        if (sendResult.success) {
            await updateStatus(pageId, "sent");
            results.push({ company: record.company, email: record.email, result: "sent" });
        }
        else {
            results.push({
                company: record.company,
                email: record.email,
                result: `failed again: ${sendResult.error}`,
            });
        }
        // Rate limit between sends
        await new Promise((r) => setTimeout(r, BULK_SEND_DELAY_MS));
    }
    return JSON.stringify({ success: true, results, total_failed: failed.length });
}
//# sourceMappingURL=retryFailed.js.map
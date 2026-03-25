import { scrapeCompany } from "../services/scraper.js";
import { researchCompany, generateEmail } from "../services/claude.js";
import { sendEmail, BULK_SEND_DELAY_MS } from "../services/email.js";
import { logRecord } from "../services/notion.js";
const MAX_COMPANIES = 15;
// ─── Tool schema ──────────────────────────────────────────────────────────────
export const bulkOutreachSchema = {
    name: "bulk_outreach",
    description: `Orchestrates the full cold outreach pipeline for up to ${MAX_COMPANIES} companies per day.

TWO-PHASE FLOW:

PHASE 1 — Research (call without confirmations or researched_companies):
  Scrapes + analyzes all companies and returns recommendations.
  Present these to the user so they can confirm or change the email type for each.

PHASE 2 — Execute (call with confirmations + researched_companies from phase 1):
  Generates emails, sends them, and logs everything to Notion.
  Pass back the researched_companies array from the phase 1 response to avoid re-scraping.`,
    inputSchema: {
        type: "object",
        properties: {
            company_urls: {
                type: "array",
                items: { type: "string" },
                description: `List of company URLs to process (max ${MAX_COMPANIES})`,
                maxItems: MAX_COMPANIES,
            },
            profile: {
                type: "object",
                description: "Your parsed profile (from parse_profile)",
                properties: {
                    role: { type: "string" },
                    skills: { type: "array", items: { type: "string" } },
                    experience: { type: "array", items: { type: "string" } },
                    strengths: { type: "array", items: { type: "string" } },
                },
                required: ["role", "skills", "experience", "strengths"],
            },
            confirmations: {
                type: "object",
                description: "PHASE 2 only. Map of company URL → chosen email type. Example: { 'https://stripe.com': 'opportunity_pitch' }",
                additionalProperties: {
                    type: "string",
                    enum: ["opportunity_pitch", "role_inquiry"],
                },
            },
            researched_companies: {
                type: "array",
                description: "PHASE 2 only. Pass the recommendations array returned from phase 1 to skip re-scraping.",
                items: { type: "object" },
            },
        },
        required: ["company_urls", "profile"],
    },
};
// ─── Phase 1: Research all companies ─────────────────────────────────────────
async function researchPhase(urls) {
    const results = [];
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.error(`[bulk] [${i + 1}/${urls.length}] Researching ${url}...`);
        try {
            const scraped = await scrapeCompany(url);
            const research = await researchCompany(scraped);
            results.push(research);
            console.error(`[bulk] [${i + 1}/${urls.length}] ✓ Recommended: ${research.recommendedType}`);
        }
        catch (err) {
            console.error(`[bulk] [${i + 1}/${urls.length}] Failed to research ${url}:`, err);
            // Push a stub so the count stays consistent and users see what failed
            results.push({
                url,
                name: url,
                email: "",
                summary: "Could not scrape or analyze this site",
                problems: [],
                suggestions: [],
                recommendedType: "role_inquiry",
                reason: "Research failed — scraping or AI call errored out",
            });
        }
    }
    return results;
}
// ─── Phase 2: Generate + send + log ──────────────────────────────────────────
async function executePhase(researched, profile, confirmations) {
    const summary = [];
    for (let i = 0; i < researched.length; i++) {
        const company = researched[i];
        const chosenType = confirmations[company.url] ?? company.recommendedType;
        console.error(`[bulk] [${i + 1}/${researched.length}] Sending to ${company.name} (${chosenType})...`);
        if (!company.email) {
            console.error(`[bulk] [${i + 1}] No email for ${company.name} — skipping`);
            summary.push({ company: company.name, status: "skipped — no email found" });
            continue;
        }
        // Generate the email
        let generated;
        try {
            generated = await generateEmail(profile, company, chosenType);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            summary.push({ company: company.name, status: `failed (email generation): ${msg}` });
            continue;
        }
        // Send it
        const sendResult = await sendEmail(company.email, generated.subject, generated.body);
        const status = sendResult.success ? "sent" : "failed";
        const notes = sendResult.success
            ? `messageId: ${sendResult.messageId}`
            : `error: ${sendResult.error}`;
        console.error(`[bulk] [${i + 1}] ${sendResult.success ? "✓" : "✗"} ${company.name}`);
        // Log to Notion regardless of send outcome
        let notionPageId;
        try {
            notionPageId = await logRecord({
                company: company.name,
                website: company.url,
                email: company.email,
                type: chosenType,
                status,
                dateSent: new Date().toISOString().split("T")[0],
                notes,
                emailBody: generated.body, // stored in Notion Notes field
            });
        }
        catch (err) {
            console.error(`[bulk] Notion log failed for ${company.name}:`, err);
        }
        summary.push({ company: company.name, status, notionPageId });
        // Pause between sends to stay off spam filters
        if (i < researched.length - 1) {
            await new Promise((r) => setTimeout(r, BULK_SEND_DELAY_MS));
        }
    }
    return summary;
}
// ─── Main handler ─────────────────────────────────────────────────────────────
export async function handleBulkOutreach(args) {
    const urls = args.company_urls.slice(0, MAX_COMPANIES);
    // ── Phase 1: Research only (no confirmations given) ──
    if (!args.confirmations) {
        const researched = await researchPhase(urls);
        const recommendations = researched.map((r) => ({
            url: r.url,
            name: r.name,
            email: r.email,
            summary: r.summary,
            problems: r.problems,
            recommendedType: r.recommendedType,
            reason: r.reason,
        }));
        return JSON.stringify({
            phase: "research_complete",
            message: "Research done. Review recommendations below and confirm the email type for each company. Then call bulk_outreach again with 'confirmations' and pass back 'researched_companies' to avoid re-scraping.",
            recommendations,
            // Return the full research data so phase 2 can reuse it
            researched_companies: researched,
        });
    }
    // ── Phase 2: Execute with confirmed types ──
    // Prefer the research data passed back from phase 1 to avoid re-scraping
    const researched = args.researched_companies && args.researched_companies.length > 0
        ? args.researched_companies
        : await researchPhase(urls);
    const results = await executePhase(researched, args.profile, args.confirmations);
    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status.startsWith("failed")).length;
    const skipped = results.filter((r) => r.status.startsWith("skipped")).length;
    return JSON.stringify({
        phase: "execution_complete",
        sent,
        failed,
        skipped,
        results,
    });
}
//# sourceMappingURL=bulkOutreach.js.map
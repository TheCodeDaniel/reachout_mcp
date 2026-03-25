import { scrapeCompany } from "../services/scraper.js";
import { researchCompany, generateEmail } from "../services/claude.js";
import { sendEmail, BULK_SEND_DELAY_MS } from "../services/email.js";
import { logRecord } from "../services/notion.js";
import type { UserProfile, EmailType, CompanyResearch, TypeConfirmations } from "../types/index.js";

const MAX_COMPANIES = 15;

// ─── Tool schema ──────────────────────────────────────────────────────────────

export const bulkOutreachSchema = {
  name: "bulk_outreach",
  description: `Orchestrates the full cold outreach pipeline for a list of companies (max ${MAX_COMPANIES}/day).

Two-phase flow:
1. RESEARCH PHASE (no confirmations provided): Scrapes and analyzes all companies, returns recommendations for each.
   Show these to the user and ask which email type they want per company.

2. EXECUTE PHASE (confirmations provided): Generates emails, sends them, and logs everything to Notion.
   Pass the confirmations map after the user reviews the recommendations.`,
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
        description:
          "Map of company URL → email type. Only provide this in phase 2, after the user has reviewed recommendations. Example: { 'https://stripe.com': 'opportunity_pitch' }",
        additionalProperties: {
          type: "string",
          enum: ["opportunity_pitch", "role_inquiry"],
        },
      },
    },
    required: ["company_urls", "profile"],
  },
};

// ─── Phase 1: Research all companies ─────────────────────────────────────────

async function researchPhase(
  urls: string[],
  _profile: UserProfile
): Promise<CompanyResearch[]> {
  const results: CompanyResearch[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[bulk] [${i + 1}/${urls.length}] Researching ${url}...`);

    try {
      const scraped = await scrapeCompany(url);
      const research = await researchCompany(scraped);
      results.push(research);
      console.log(`[bulk] [${i + 1}/${urls.length}] ✓ Recommended: ${research.recommendedType}`);
    } catch (err) {
      console.error(`[bulk] [${i + 1}/${urls.length}] Failed to research ${url}:`, err);
      // Push a minimal stub so the count stays consistent
      results.push({
        url,
        name: url,
        email: "",
        summary: "Could not scrape this site",
        problems: [],
        suggestions: [],
        recommendedType: "role_inquiry",
        reason: "Scraping failed",
      });
    }
  }

  return results;
}

// ─── Phase 2: Generate + send + log ──────────────────────────────────────────

async function executePhase(
  researched: CompanyResearch[],
  profile: UserProfile,
  confirmations: TypeConfirmations
): Promise<Array<{ company: string; status: string; notionPageId?: string }>> {
  const summary: Array<{ company: string; status: string; notionPageId?: string }> = [];

  for (let i = 0; i < researched.length; i++) {
    const company = researched[i];
    const chosenType: EmailType = confirmations[company.url] ?? company.recommendedType;

    console.log(
      `[bulk] [${i + 1}/${researched.length}] Sending to ${company.name} (${chosenType})...`
    );

    // Must have an email to send to
    if (!company.email) {
      console.warn(`[bulk] [${i + 1}] No email for ${company.name} — skipping`);
      summary.push({ company: company.name, status: "skipped — no email found" });
      continue;
    }

    // Generate the email
    let generated;
    try {
      generated = await generateEmail(profile, company, chosenType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      summary.push({ company: company.name, status: `failed (email gen): ${msg}` });
      continue;
    }

    // Send it
    const sendResult = await sendEmail(company.email, generated.subject, generated.body);

    const status = sendResult.success ? "sent" : "failed";
    const notes = sendResult.success
      ? `messageId: ${sendResult.messageId}`
      : `error: ${sendResult.error}`;

    console.log(`[bulk] [${i + 1}] ${sendResult.success ? "✓" : "✗"} ${company.name}`);

    // Log to Notion
    let notionPageId: string | undefined;
    try {
      notionPageId = await logRecord({
        company: company.name,
        website: company.url,
        email: company.email,
        type: chosenType,
        status,
        dateSent: new Date().toISOString().split("T")[0],
        notes,
        emailBody: generated.body,
      });
    } catch (err) {
      console.error(`[bulk] Notion log failed for ${company.name}:`, err);
    }

    summary.push({ company: company.name, status, notionPageId });

    // Pause between sends to avoid spam filters
    if (i < researched.length - 1) {
      await new Promise((r) => setTimeout(r, BULK_SEND_DELAY_MS));
    }
  }

  return summary;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleBulkOutreach(args: {
  company_urls: string[];
  profile: UserProfile;
  confirmations?: TypeConfirmations;
}): Promise<string> {
  // Enforce the daily limit
  const urls = args.company_urls.slice(0, MAX_COMPANIES);

  // ── Phase 1: Research only ──
  if (!args.confirmations) {
    const researched = await researchPhase(urls, args.profile);

    // Format recommendations clearly so Claude can present them to the user
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
      message:
        "Research done. Review the recommendations below and confirm which email type you want for each company. Then call bulk_outreach again with the 'confirmations' map.",
      recommendations,
    });
  }

  // ── Phase 2: Execute with confirmed types ──
  // Re-run research to get fresh data (or in a real app you'd cache it)
  const researched = await researchPhase(urls, args.profile);
  const results = await executePhase(researched, args.profile, args.confirmations);

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status.startsWith("failed")).length;

  return JSON.stringify({
    phase: "execution_complete",
    sent,
    failed,
    results,
  });
}

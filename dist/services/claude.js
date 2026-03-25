import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { buildResearchPrompt } from "../prompts/researchPrompt.js";
import { buildOpportunityPitchPrompt } from "../prompts/opportunityPitchPrompt.js";
import { buildRoleInquiryPrompt } from "../prompts/roleInquiryPrompt.js";
const client = new Anthropic({ apiKey: env.anthropicApiKey });
// The model we use for all AI tasks — best quality for contest-level work
const MODEL = "claude-opus-4-6";
// Parses a JSON string out of Claude's response, even if wrapped in markdown fences
function parseJson(raw) {
    const cleaned = raw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    return JSON.parse(cleaned);
}
// Sends a single message to Claude and returns the full text response.
// We use `any` for the create call because the 'thinking' field is valid in the API
// but this SDK version's types don't include it yet.
async function ask(prompt) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        messages: [{ role: "user", content: prompt }],
    });
    // Thinking blocks come first — find and return the text block
    for (const block of response.content) {
        if (block.type === "text")
            return block.text;
    }
    throw new Error("Claude returned no text block");
}
// Analyzes a scraped company page and returns structured research data
export async function researchCompany(scraped) {
    const prompt = buildResearchPrompt(scraped.name, scraped.textContent);
    const raw = await ask(prompt);
    let parsed;
    try {
        parsed = parseJson(raw);
    }
    catch {
        // If Claude's response isn't valid JSON, return a safe fallback
        return {
            url: scraped.url,
            name: scraped.name,
            email: scraped.foundEmails[0] ?? "",
            summary: raw.slice(0, 200),
            problems: [],
            suggestions: [],
            recommendedType: "role_inquiry",
            reason: "Could not parse structured response",
        };
    }
    return {
        url: scraped.url,
        name: scraped.name,
        email: scraped.foundEmails[0] ?? "",
        summary: parsed.summary,
        problems: parsed.problems,
        suggestions: parsed.suggestions,
        recommendedType: parsed.recommendedType,
        reason: parsed.reason,
    };
}
// Generates a human-sounding email based on profile, company data, and chosen type
export async function generateEmail(profile, company, type) {
    const prompt = type === "opportunity_pitch"
        ? buildOpportunityPitchPrompt(profile, company)
        : buildRoleInquiryPrompt(profile, company);
    const raw = await ask(prompt);
    let parsed;
    try {
        parsed = parseJson(raw);
    }
    catch {
        // Fallback: treat the whole response as the body
        return {
            subject: `Quick note re: ${company.name}`,
            body: raw,
        };
    }
    return { subject: parsed.subject, body: parsed.body };
}
// Discovers relevant companies for a given profile using Claude's knowledge.
// Returns a list of real company URLs tailored to the user's skills and background.
export async function discoverCompanies(profile, count = 10, niche) {
    const nicheHint = niche ? `\nFocus specifically on: ${niche}` : "";
    const prompt = `You are helping someone find companies to cold-email for job opportunities or freelance work.

Their profile:
- Role: ${profile.role}
- Skills: ${profile.skills.join(", ")}
- Experience: ${profile.experience.join(" | ")}
- Strengths: ${profile.strengths.join(", ")}
${nicheHint}

Find ${count} real companies that would be a strong match for this person. Prioritise:
- Companies whose product or tech stack matches their skills
- Smaller or mid-size companies (10–500 people) where one person can make a visible impact
- Companies known for hiring remotely or having strong engineering cultures
- Avoid FAANG / mega-corps — they rarely respond to cold outreach

Reply ONLY with valid JSON in this exact shape:
{
  "companies": [
    { "name": "Company Name", "url": "https://company.com", "reason": "one sentence why they're a good fit" }
  ]
}

Only include companies you are confident exist and whose URL is correct. No placeholders.`;
    const raw = await ask(prompt);
    let parsed;
    try {
        parsed = parseJson(raw);
    }
    catch {
        throw new Error("Claude could not generate a company list — try again or add a niche hint.");
    }
    return parsed.companies.map((c) => c.url);
}
// Parses a CV or resume text and extracts a structured user profile
export async function parseProfileText(cvText) {
    const prompt = `Extract structured info from this CV or profile text.

Text:
---
${cvText.slice(0, 8000)}
---

Reply ONLY with valid JSON in this exact shape:
{
  "role": "the person's main title or role",
  "skills": ["skill1", "skill2", "..."],
  "experience": ["brief summary of each relevant experience"],
  "strengths": ["2-4 key strengths"]
}

Keep it concise. Skills should be specific (e.g. "React", "Node.js", not "technology").`;
    const raw = await ask(prompt);
    try {
        return parseJson(raw);
    }
    catch {
        // If parsing fails return a minimal profile so the flow doesn't break
        return {
            role: "Professional",
            skills: [],
            experience: [cvText.slice(0, 200)],
            strengths: [],
        };
    }
}
//# sourceMappingURL=claude.js.map
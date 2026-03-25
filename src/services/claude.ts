import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { buildResearchPrompt } from "../prompts/researchPrompt.js";
import { buildOpportunityPitchPrompt } from "../prompts/opportunityPitchPrompt.js";
import { buildRoleInquiryPrompt } from "../prompts/roleInquiryPrompt.js";
import type {
  UserProfile,
  CompanyResearch,
  GeneratedEmail,
  ScrapedCompany,
  EmailType,
} from "../types/index.js";

const client = new Anthropic({ apiKey: env.anthropicApiKey });

// The model we use for all AI tasks — best quality for contest-level work
const MODEL = "claude-opus-4-6";

// Parses a JSON string out of Claude's response, even if wrapped in markdown fences
function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// Sends a single message to Claude and returns the full text response.
// We use `any` for the create call because the 'thinking' field is valid in the API
// but this SDK version's types don't include it yet.
async function ask(prompt: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = await (client.messages.create as any)({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  // Thinking blocks come first — find and return the text block
  for (const block of response.content) {
    if (block.type === "text") return block.text as string;
  }

  throw new Error("Claude returned no text block");
}

// Analyzes a scraped company page and returns structured research data
export async function researchCompany(scraped: ScrapedCompany): Promise<CompanyResearch> {
  const prompt = buildResearchPrompt(scraped.name, scraped.textContent);
  const raw = await ask(prompt);

  let parsed: {
    summary: string;
    problems: string[];
    suggestions: string[];
    recommendedType: EmailType;
    reason: string;
  };

  try {
    parsed = parseJson(raw);
  } catch {
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
export async function generateEmail(
  profile: UserProfile,
  company: CompanyResearch,
  type: EmailType
): Promise<GeneratedEmail> {
  const prompt =
    type === "opportunity_pitch"
      ? buildOpportunityPitchPrompt(profile, company)
      : buildRoleInquiryPrompt(profile, company);

  const raw = await ask(prompt);

  let parsed: { subject: string; body: string };

  try {
    parsed = parseJson(raw);
  } catch {
    // Fallback: treat the whole response as the body
    return {
      subject: `Quick note re: ${company.name}`,
      body: raw,
    };
  }

  return { subject: parsed.subject, body: parsed.body };
}

// Parses a CV or resume text and extracts a structured user profile
export async function parseProfileText(cvText: string): Promise<UserProfile> {
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
    return parseJson<UserProfile>(raw);
  } catch {
    // If parsing fails return a minimal profile so the flow doesn't break
    return {
      role: "Professional",
      skills: [],
      experience: [cvText.slice(0, 200)],
      strengths: [],
    };
  }
}

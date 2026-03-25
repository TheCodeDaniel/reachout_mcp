import { discoverCompanies } from "../services/claude.js";
import type { UserProfile } from "../types/index.js";

const MAX_COMPANIES = 15;

export const discoverCompaniesSchema = {
  name: "discover_companies",
  description: `Uses Claude to find real companies that match your profile — no manual URL input needed.
Returns a list of company URLs ready to pass into bulk_outreach.`,
  inputSchema: {
    type: "object",
    properties: {
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
      count: {
        type: "number",
        description: `How many companies to find (default 10, max ${MAX_COMPANIES})`,
      },
      niche: {
        type: "string",
        description: `Optional focus area to narrow results. E.g. "fintech startups", "developer tools", "remote-first SaaS"`,
      },
    },
    required: ["profile"],
  },
};

export async function handleDiscoverCompanies(args: {
  profile: UserProfile;
  count?: number;
  niche?: string;
}): Promise<string> {
  const count = Math.min(args.count ?? 10, MAX_COMPANIES);
  const urls = await discoverCompanies(args.profile, count, args.niche);

  return JSON.stringify({
    found: urls.length,
    company_urls: urls,
    message: `Found ${urls.length} companies. Pass company_urls into bulk_outreach to start researching them.`,
  });
}

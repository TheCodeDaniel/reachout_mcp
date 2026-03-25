import { scrapeCompany } from "../services/scraper.js";
import { researchCompany } from "../services/claude.js";

export const researchCompanySchema = {
  name: "research_company",
  description:
    "Scrapes a company website and uses AI to analyze their product, find pain points, and recommend the best email type (opportunity_pitch or role_inquiry).",
  inputSchema: {
    type: "object",
    properties: {
      website_url: {
        type: "string",
        description: "The company website URL",
      },
    },
    required: ["website_url"],
  },
};

export async function handleResearchCompany(args: { website_url: string }): Promise<string> {
  const scraped = await scrapeCompany(args.website_url);
  const research = await researchCompany(scraped);

  return JSON.stringify({ success: true, research });
}

import { scrapeCompany } from "../services/scraper.js";
export const findEmailSchema = {
    name: "find_company_email",
    description: "Scrapes a company website to find a contact email. Checks the main page, contact page, and tries common patterns like contact@, info@, etc.",
    inputSchema: {
        type: "object",
        properties: {
            website_url: {
                type: "string",
                description: "The company website URL (e.g. https://stripe.com)",
            },
        },
        required: ["website_url"],
    },
};
export async function handleFindEmail(args) {
    const scraped = await scrapeCompany(args.website_url);
    return JSON.stringify({
        success: true,
        url: scraped.url,
        name: scraped.name,
        emails_found: scraped.foundEmails,
        // Best guess is always the first one
        best_email: scraped.foundEmails[0] ?? null,
    });
}
//# sourceMappingURL=findEmail.js.map
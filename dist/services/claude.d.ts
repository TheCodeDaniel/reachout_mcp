import type { UserProfile, CompanyResearch, GeneratedEmail, ScrapedCompany, EmailType } from "../types/index.js";
export declare function researchCompany(scraped: ScrapedCompany): Promise<CompanyResearch>;
export declare function generateEmail(profile: UserProfile, company: CompanyResearch, type: EmailType): Promise<GeneratedEmail>;
export declare function parseProfileText(cvText: string): Promise<UserProfile>;
//# sourceMappingURL=claude.d.ts.map
export type EmailType = "opportunity_pitch" | "role_inquiry";
export type OutreachStatus = "pending" | "sent" | "failed" | "replied";
export interface UserProfile {
    skills: string[];
    experience: string[];
    role: string;
    strengths: string[];
}
export interface ScrapedCompany {
    url: string;
    name: string;
    textContent: string;
    foundEmails: string[];
}
export interface CompanyResearch {
    url: string;
    name: string;
    email: string;
    summary: string;
    problems: string[];
    suggestions: string[];
    recommendedType: EmailType;
    reason: string;
}
export interface GeneratedEmail {
    subject: string;
    body: string;
}
export interface OutreachRecord {
    company: string;
    website: string;
    email: string;
    type: EmailType;
    status: OutreachStatus;
    dateSent?: string;
    notes?: string;
    emailBody?: string;
}
export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export type TypeConfirmations = Record<string, EmailType>;
//# sourceMappingURL=index.d.ts.map
// All shared types and interfaces for the Cold Outreach MCP

export type EmailType = "opportunity_pitch" | "role_inquiry";
export type OutreachStatus = "pending" | "sent" | "failed" | "replied";

// What we extract from the user's CV / resume
export interface UserProfile {
  skills: string[];
  experience: string[];
  role: string;
  strengths: string[];
}

// Raw scraped data before Claude analyzes it
export interface ScrapedCompany {
  url: string;
  name: string;         // extracted from <title> or og:site_name
  textContent: string;  // cleaned page text, capped at ~5000 chars
  foundEmails: string[]; // emails found directly on the page
}

// What Claude returns after analyzing a company
export interface CompanyResearch {
  url: string;
  name: string;
  email: string;                // best email found (or empty string)
  summary: string;              // 2–3 sentence product/company summary
  problems: string[];           // specific pain points spotted
  suggestions: string[];        // how the user could help
  recommendedType: EmailType;   // what Claude thinks is the better email type
  reason: string;               // one-line reason for the recommendation
}

// A generated email (subject + body)
export interface GeneratedEmail {
  subject: string;
  body: string;
}

// A single outreach record — what gets logged to Notion
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

// Result of an email send attempt
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Confirmation map passed by user after reviewing recommendations
// key = company URL, value = chosen email type
export type TypeConfirmations = Record<string, EmailType>;

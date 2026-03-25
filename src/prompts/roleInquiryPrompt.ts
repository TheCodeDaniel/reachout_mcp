import type { UserProfile, CompanyResearch } from "../types/index.js";

// Prompt for writing a "role inquiry" email.
// Used when the company looks like a great fit but no obvious problem was spotted.

export function buildRoleInquiryPrompt(
  profile: UserProfile,
  company: CompanyResearch
): string {
  return `Write a cold outreach email from the person below to ${company.name}.

Sender profile:
- Role: ${profile.role}
- Skills: ${profile.skills.join(", ")}
- Experience: ${profile.experience.join(", ")}
- Strengths: ${profile.strengths.join(", ")}

Company background:
- Website: ${company.url}
- What they do: ${company.summary}

Email type: Role Inquiry — the sender genuinely likes this company and wants to explore if there's room for them.

Write the subject line AND the email body. Reply in this JSON format:
{
  "subject": "...",
  "body": "..."
}

Tone rules (very important):
- Sound like a real human, not a template
- Short sentences. Casual but professional.
- Start with one genuine observation about the company — something specific that caught their eye
- Briefly introduce who you are and what you're good at (one or two lines max)
- Express interest without being desperate
- Keep it under 100 words
- No buzzwords, no corporate speak, no "I'm passionate about synergizing"
- End with a simple, open ask — not a hard "interview me"

Good example tone:
"Your product design is really clean — the way you handle [specific thing] is exactly the kind of thoughtfulness I look for in a team. I'm a Flutter dev with [X] years building [type of thing]. If there's ever room for someone like me, I'd love to chat."`;
}

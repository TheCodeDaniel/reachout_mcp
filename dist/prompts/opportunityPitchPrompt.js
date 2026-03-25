// Prompt for writing an "opportunity pitch" email.
// Used when we spotted a real problem the sender can help with.
export function buildOpportunityPitchPrompt(profile, company) {
    return `Write a cold outreach email from the person below to ${company.name}.

Sender profile:
- Role: ${profile.role}
- Skills: ${profile.skills.join(", ")}
- Experience: ${profile.experience.join(", ")}
- Strengths: ${profile.strengths.join(", ")}

Company background:
- Website: ${company.url}
- What they do: ${company.summary}
- Problems spotted: ${company.problems.join("; ")}
- How the sender could help: ${company.suggestions.join("; ")}

Email type: Opportunity Pitch — the sender noticed a specific problem and is offering to help.

Write the subject line AND the email body. Reply in this JSON format:
{
  "subject": "...",
  "body": "..."
}

Tone rules (very important):
- Sound like a real person wrote it, not an AI or a marketing team
- Short sentences. Get to the point fast.
- Start with what you noticed — not "I hope this finds you well" or generic compliments
- Mention one specific thing you spotted on their site or product
- Keep it under 120 words
- No buzzwords. No "synergy", "leverage", "value-add", etc.
- End with a simple, low-pressure ask — not "Let's hop on a call ASAP!"

Good example tone:
"Hey, I was checking out your onboarding flow and noticed the signup process has a few extra steps that might be dropping users. I've fixed similar issues before for [type of company] — could cut drop-off by a decent margin. Happy to show you what I mean if it's worth a chat."`;
}
//# sourceMappingURL=opportunityPitchPrompt.js.map
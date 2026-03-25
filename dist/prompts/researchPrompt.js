// Prompt sent to Claude when analyzing a company's website.
// Returns structured JSON so we can parse it reliably.
export function buildResearchPrompt(companyName, websiteContent) {
    return `You are analyzing a company to help someone write a personalized cold outreach email.

Company: ${companyName}
Website content:
---
${websiteContent}
---

Based on this, provide a structured analysis. Reply ONLY with valid JSON in this exact shape:

{
  "summary": "2-3 sentences on what the company does and who they serve",
  "problems": ["specific problem or friction point you noticed", "another if applicable"],
  "suggestions": ["how the person reaching out could help with problem 1", "..."],
  "recommendedType": "opportunity_pitch" | "role_inquiry",
  "reason": "one sentence explaining why this email type fits better"
}

Rules:
- "problems" should be specific and real — not generic like "they could improve UX". Point to something concrete.
- If you can't spot a clear problem, say so in suggestions and set recommendedType to "role_inquiry".
- Keep everything short and direct. No fluff.
- If the content is too thin to analyze, return empty arrays and explain in "reason".`;
}
//# sourceMappingURL=researchPrompt.js.map
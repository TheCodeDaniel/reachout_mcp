import { generateEmail } from "../services/claude.js";
export const generateEmailSchema = {
    name: "generate_email",
    description: "Generates a human-sounding cold outreach email for a specific company. Short, direct, no buzzwords.",
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
            company: {
                type: "object",
                description: "Company research data (from research_company)",
                properties: {
                    url: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                    summary: { type: "string" },
                    problems: { type: "array", items: { type: "string" } },
                    suggestions: { type: "array", items: { type: "string" } },
                    recommendedType: { type: "string" },
                    reason: { type: "string" },
                },
                required: ["url", "name", "email", "summary", "problems", "suggestions"],
            },
            type: {
                type: "string",
                enum: ["opportunity_pitch", "role_inquiry"],
                description: "The email type to generate",
            },
        },
        required: ["profile", "company", "type"],
    },
};
export async function handleGenerateEmail(args) {
    const email = await generateEmail(args.profile, args.company, args.type);
    return JSON.stringify({ success: true, email });
}
//# sourceMappingURL=generateEmail.js.map
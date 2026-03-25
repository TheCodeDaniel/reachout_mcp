import dotenv from "dotenv";
dotenv.config();
// Validates and exports all required environment variables.
// Only the truly essential keys (AI + Notion) are required at startup.
// SMTP fields are optional here and validated lazily when sendEmail() is first called.
function requireEnv(key) {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env var: ${key}`);
    return val;
}
function optional(key, fallback = "") {
    return process.env[key] ?? fallback;
}
export const env = {
    // Claude AI — required
    anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
    // Notion — API key required; database ID is set after running setup_notion_db
    notionApiKey: requireEnv("NOTION_API_KEY"),
    notionDatabaseId: optional("NOTION_DATABASE_ID"),
    // SMTP — optional at startup; validated when first send is attempted
    smtpHost: optional("SMTP_HOST", "smtp.gmail.com"),
    smtpPort: parseInt(optional("SMTP_PORT", "587"), 10),
    smtpUser: optional("SMTP_USER"),
    smtpPass: optional("SMTP_PASS"),
    // Sender identity shown in outgoing emails
    senderEmail: optional("SENDER_EMAIL"),
    senderName: optional("SENDER_NAME", ""),
};
//# sourceMappingURL=env.js.map
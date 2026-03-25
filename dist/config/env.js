import dotenv from "dotenv";
dotenv.config();
// Validates and exports all required environment variables.
// Throws early with a clear message if anything is missing.
function require(key) {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env var: ${key}`);
    return val;
}
function optional(key, fallback = "") {
    return process.env[key] ?? fallback;
}
export const env = {
    // Claude AI
    anthropicApiKey: require("ANTHROPIC_API_KEY"),
    // Notion
    notionApiKey: require("NOTION_API_KEY"),
    notionDatabaseId: optional("NOTION_DATABASE_ID"), // set after setup_notion_db
    notionParentPageId: optional("NOTION_PARENT_PAGE_ID"), // needed for setup_notion_db
    // SMTP
    smtpHost: optional("SMTP_HOST", "smtp.gmail.com"),
    smtpPort: parseInt(optional("SMTP_PORT", "587"), 10),
    smtpUser: require("SMTP_USER"),
    smtpPass: require("SMTP_PASS"),
    // Sender identity shown in emails
    senderEmail: require("SENDER_EMAIL"),
    senderName: optional("SENDER_NAME", ""),
};
//# sourceMappingURL=env.js.map
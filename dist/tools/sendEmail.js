import { sendEmail } from "../services/email.js";
export const sendEmailSchema = {
    name: "send_email",
    description: "Sends an email via SMTP. Returns success/failure and the message ID.",
    inputSchema: {
        type: "object",
        properties: {
            to: {
                type: "string",
                description: "Recipient email address",
            },
            subject: {
                type: "string",
                description: "Email subject line",
            },
            body: {
                type: "string",
                description: "Plain text email body",
            },
        },
        required: ["to", "subject", "body"],
    },
};
export async function handleSendEmail(args) {
    const result = await sendEmail(args.to, args.subject, args.body);
    return JSON.stringify(result);
}
//# sourceMappingURL=sendEmail.js.map
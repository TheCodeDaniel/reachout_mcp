import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import type { SendResult } from "../types/index.js";

// Max times we retry a failed send before giving up
const MAX_RETRIES = 2;

// How long to wait between retries (ms)
const RETRY_DELAY_MS = 3_000;

// Delay between each email in a bulk send — keeps us from hitting spam filters
export const BULK_SEND_DELAY_MS = 2_000;

// Lazily created transporter — we only create it once
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

// Waits for a given number of milliseconds
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sends an email with retry logic.
// Returns a SendResult so callers can decide what to log.
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<SendResult> {
  const transport = getTransporter();

  const mailOptions = {
    from: env.senderName
      ? `"${env.senderName}" <${env.senderEmail}>`
      : env.senderEmail,
    to,
    subject,
    text: body, // plain text only — easier to read, less likely to be flagged as spam
  };

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const info = await transport.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[email] Send attempt ${attempt} failed:`, lastError);

      // Only sleep if we're going to retry
      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  return { success: false, error: lastError };
}

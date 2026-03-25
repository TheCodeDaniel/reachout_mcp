# Cold Outreach MCP — Production Architecture (Node.js / TypeScript)

---

## 1. Problem

Developers, designers, and freelancers send cold outreach emails manually:

- Find company
- Find email
- Research company
- Write email
- Send email
- Track status

This is slow, repetitive, and the emails usually sound robotic.

---

## 2. Solution

A **Local MCP Server** that automates the full cold outreach pipeline:

- Scrapes and researches companies (up to 15/day)
- Finds real contact emails
- Recommends the best email type per company (based on what it found)
- Lets the user confirm or override per company
- Generates emails that sound like a real human wrote them
- Sends emails via SMTP/Gmail/Outlook
- Logs everything to Notion

---

## 3. Core Rules & Principles

### Email Tone
- Short sentences. Casual but professional.
- No buzzwords. No "I hope this email finds you well."
- No corporate fluff. No AI-sounding language.
- Reads like a real person reaching out — not a template.

### Daily Limit
- Max **15 companies per run**
- Rate limiting between sends (2s delay minimum) to avoid spam flags

### Smart Email Type Selection
- After scraping all companies, the system **pauses before generating**
- It presents a summary of each company with a **recommended email type** and a reason
- The user confirms or overrides each one
- Then emails are generated based on confirmed choices

---

## 4. Email Types

### Type 1 — Opportunity Pitch
Used when: the company has a visible problem, friction, or gap you can address.

Example:
> "Your onboarding flow has a few rough edges — I've helped fix similar issues before and thought I'd reach out."

### Type 2 — Role Inquiry
Used when: the company looks like a great fit but no obvious pain point was found.

Example:
> "I'm a Flutter developer and your product caught my eye. Just wanted to reach out and see if there's room for someone like me."

---

## 5. Full Workflow

```
User provides:
  - Their profile (CV / resume text / skills)
  - List of company URLs (max 15)

  ↓

1. parse_profile
   → Extract: skills, experience, role, strengths

  ↓

2. bulk_outreach (orchestrator)
   For each company:
     → find_company_email
     → research_company

  ↓

3. Recommendation Step (interactive pause)
   → Show user: company + scraped summary + recommended type + reason
   → User confirms or overrides type per company

  ↓

4. generate_email (per company)
   → Uses confirmed type + profile + research data
   → Produces human-sounding email

  ↓

5. send_email (per company)
   → SMTP / Gmail / Outlook via nodemailer
   → 2s delay between sends
   → Retry up to 2x on failure

  ↓

6. log_to_notion
   → Log: company, email, type, status, date, notes
```

---

## 6. MCP Tools

| Tool | Input | Output |
|---|---|---|
| `setup_notion_db` | — | Creates DB schema in Notion |
| `parse_profile` | CV path or text | `{ skills, experience, role }` |
| `find_company_email` | `website_url` | `email` (scraped or guessed) |
| `research_company` | `website_url` | `{ summary, problems, suggestions, recommended_type, reason }` |
| `generate_email` | `profile, company, type` | `email_body` (human tone) |
| `send_email` | `to, subject, body` | `{ success, message_id }` |
| `bulk_outreach` | `company_list[]` (max 15) | Runs full pipeline per company |
| `log_to_notion` | outreach record | Notion page created |
| `retry_failed` | — | Retries all `failed` entries in Notion |

---

## 7. Project Structure

```
cold-outreach-mcp/
│
├── src/
│   │
│   ├── tools/                  # MCP tool definitions (thin layer, calls services)
│   │   ├── setupNotion.ts
│   │   ├── parseProfile.ts
│   │   ├── findEmail.ts
│   │   ├── researchCompany.ts
│   │   ├── generateEmail.ts
│   │   ├── sendEmail.ts
│   │   ├── bulkOutreach.ts
│   │   ├── logToNotion.ts
│   │   └── retryFailed.ts
│   │
│   ├── services/               # Business logic (each file stays under 400 lines)
│   │   ├── claude.ts           # Claude API calls (research + email generation)
│   │   ├── notion.ts           # Notion DB read/write
│   │   ├── email.ts            # nodemailer send logic
│   │   ├── scraper.ts          # axios + cheerio scraping
│   │   └── profileParser.ts    # CV/text parsing logic
│   │
│   ├── prompts/                # Claude prompt templates (separated from logic)
│   │   ├── researchPrompt.ts
│   │   ├── opportunityPitchPrompt.ts
│   │   └── roleInquiryPrompt.ts
│   │
│   ├── types/
│   │   └── index.ts            # All shared TypeScript types/interfaces
│   │
│   ├── config/
│   │   └── env.ts              # Env var loading + validation
│   │
│   └── index.ts                # MCP server entry point
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

### Architecture Rules
- **Tools** = thin wrappers. They validate input and call services.
- **Services** = all real logic lives here.
- **Prompts** = Claude prompt strings are isolated in their own files. Easy to tune.
- **No file exceeds 400 lines.** Split into sub-services if needed.
- **Clean comments** on every non-obvious function — no comment noise on simple code.

---

## 8. Notion Database Schema

| Field | Type | Notes |
|---|---|---|
| Company | Title | Company name |
| Website | URL | Source URL |
| Email | Email | Contact email found |
| Type | Select | `opportunity_pitch` / `role_inquiry` |
| Status | Select | `pending` / `sent` / `failed` / `replied` |
| Date Sent | Date | Timestamp of send |
| Notes | Text | Error messages, extra context |

---

## 9. Tech Stack

| Layer | Library |
|---|---|
| MCP | `@modelcontextprotocol/sdk` |
| AI | `@anthropic-ai/sdk` (Claude) |
| Email | `nodemailer` |
| Scraping | `axios` + `cheerio` |
| Notion | `@notionhq/client` |
| Config | `dotenv` |
| Language | TypeScript (Node.js) |

---

## 10. Environment Variables

```
ANTHROPIC_API_KEY=

NOTION_API_KEY=
NOTION_DATABASE_ID=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

SENDER_EMAIL=
```

---

## 11. Claude Prompt Guidelines

### Research Prompt
- Summarize what the company does (2–3 sentences max)
- Identify real pain points or gaps (be specific, not generic)
- Suggest how the user could help
- Recommend email type: `opportunity_pitch` or `role_inquiry` with a short reason

### Opportunity Pitch Prompt
- Start with something specific you noticed (not generic praise)
- Mention one concrete problem
- Offer help without overselling
- Keep it under 120 words
- Sound like a real person, not a marketer

### Role Inquiry Prompt
- Brief intro — who you are, what you do
- One line on why this company specifically caught your eye
- Express interest in contributing
- Keep it under 100 words
- Casual and direct

---

## 12. Production Considerations

### Rate Limiting
- 2 second delay between each email send
- Respect the 15 companies/day cap

### Error Handling
- Each step wrapped in try/catch
- Failed sends logged to Notion with error notes
- `retry_failed` tool re-attempts all `failed` Notion entries (max 2 retries per company)

### Logging
- Console logs at each step for visibility:
  ```
  [1/5] Researching stripe.com...
  [1/5] Email found: contact@stripe.com
  [1/5] Recommended type: opportunity_pitch — checkout friction detected
  [1/5] Sending email...
  [1/5] ✓ Sent. Logged to Notion.
  ```

---

## 13. Future Features (Not in MVP)

- Email follow-ups (day 3, day 7)
- LinkedIn profile scraping
- Company discovery (find companies automatically by niche)
- Analytics dashboard (Next.js frontend)
- Reply detection + status auto-update

---

## 14. Why This Works

- Solves a real, painful problem
- AI does the heavy lifting but the user stays in control
- Emails sound human — not AI-generated spam
- Notion gives a clean outreach CRM out of the box
- Clean, extensible architecture that can grow

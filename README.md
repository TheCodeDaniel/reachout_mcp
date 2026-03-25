# Cold Outreach MCP

An MCP server that automates cold email outreach — from scraping company websites to sending human-sounding emails and tracking everything in Notion.

---

## What It Does

1. **Researches** companies — scrapes their site, finds contact emails, and uses Claude to spot pain points
2. **Recommends** an email type per company — *Opportunity Pitch* (spotted a problem) or *Role Inquiry* (great fit, want to join)
3. **Asks you to confirm** — you review and approve or change each recommendation before anything is sent
4. **Generates emails** that sound like a real person wrote them — short, specific, no buzzwords
5. **Sends** via your Gmail / Outlook / SMTP with a rate limit between sends
6. **Logs** every outreach to a Notion database you own

---

## Requirements

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/settings/keys)
- A [Notion account](https://notion.so) with an integration set up
- A Gmail or Outlook account (or any SMTP provider)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd cold-outreach-mcp
npm install
npm run build
```

---

### 2. Get your API keys

**Anthropic (Claude AI)**
1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Copy the key — it starts with `sk-ant-...`

**Notion**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration**
3. Give it a name (e.g. "Cold Outreach MCP"), select your workspace
4. Click **Submit** → copy the **Internal Integration Secret** (starts with `ntn_...` or `secret_...`)
5. Go to any Notion page where you want the database to live
6. Click the `...` menu → **Connect to** → select your integration

**Gmail (App Password)**
1. Your Google account must have 2-Factor Authentication enabled
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select **Mail** → your device → click **Generate**
4. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`) — use it without spaces

> **Outlook:** Use `smtp.office365.com`, port `587`, and your regular password (or an app password if your org requires it).

---

### 3. Configure your environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
ANTHROPIC_API_KEY=sk-ant-...

NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=          # leave empty for now

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=abcdefghijklmnop   # Gmail App Password, no spaces

SENDER_EMAIL=you@gmail.com
SENDER_NAME=Your Name
```

---

### 4. Register the MCP server with Claude Desktop

Open (or create) `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "cold-outreach": {
      "command": "node",
      "args": ["/absolute/path/to/cold-outreach-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "NOTION_API_KEY": "ntn_...",
        "NOTION_DATABASE_ID": "",
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "you@gmail.com",
        "SMTP_PASS": "abcdefghijklmnop",
        "SENDER_EMAIL": "you@gmail.com",
        "SENDER_NAME": "Your Name"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

### 5. Create the Notion database (one time)

In Claude, run:

```
Use setup_notion_db with parent_page_id = <your page ID>
```

To get your page ID:
- Open the Notion page where you want the database
- Copy the URL: `https://notion.so/My-Page-abc123def456`
- The ID is the last part: `abc123def456`

The tool will return a `database_id`. Copy it into your `.env` (and Claude Desktop config) as `NOTION_DATABASE_ID`, then restart Claude Desktop.

---

## Usage

### Full bulk outreach flow

**Step 1 — Parse your profile**
```
Use parse_profile with my CV text:
[paste your CV or resume here]
```

**Step 2 — Research companies (Phase 1)**
```
Use bulk_outreach with:
- company_urls: ["https://stripe.com", "https://linear.app", "https://notion.so"]
- profile: [paste the profile from step 1]
```

Claude will scrape each site, analyze them, and show you something like:

```
1. stripe.com
   → Recommended: opportunity_pitch
   → Reason: Checkout onboarding has visible friction — good fit for your UX work

2. linear.app
   → Recommended: role_inquiry
   → Reason: Fast-growing team, no clear gap spotted — strong product match

3. notion.so
   → Recommended: role_inquiry
   → Reason: Site content is thin, couldn't find a specific problem to pitch
```

**Step 3 — Confirm and send (Phase 2)**

Tell Claude which type you want for each, then:
```
Use bulk_outreach again with:
- company_urls: [same list]
- profile: [same profile]
- confirmations: { "https://stripe.com": "opportunity_pitch", "https://linear.app": "role_inquiry", "https://notion.so": "opportunity_pitch" }
- researched_companies: [paste the researched_companies array from the phase 1 response]
```

Emails are generated, sent, and logged to Notion automatically.

---

### Individual tools

| Tool | What it does |
|---|---|
| `setup_notion_db` | Creates the tracking database in Notion (run once) |
| `parse_profile` | Extracts skills/experience from your CV or resume text |
| `find_company_email` | Scrapes a site to find a contact email |
| `research_company` | Analyzes a company — summary, problems, recommendation |
| `generate_email` | Writes one email given profile + company + type |
| `send_email` | Sends an email via SMTP |
| `log_to_notion` | Logs an outreach record manually |
| `retry_failed` | Re-sends all emails marked "failed" in Notion |
| `bulk_outreach` | Full pipeline for up to 15 companies |

---

## Daily limit

The server enforces a max of **15 companies per `bulk_outreach` call** and adds a **2 second delay** between sends to avoid spam filters.

---

## Email types

**Opportunity Pitch** — Used when the research spotted a specific problem.
> "Your onboarding flow has a few rough edges — I've fixed similar issues before and thought I'd reach out."

**Role Inquiry** — Used when the company looks like a great fit but no clear problem was found.
> "I'm a Flutter developer and your product caught my eye. Just wanted to see if there's room for someone like me."

Both types are kept under 120 words and written to sound like a real person — not a template.

---

## Notion database

After setup, you'll have a database with these fields:

| Field | Type | Notes |
|---|---|---|
| Company | Title | Company name |
| Website | URL | Source URL |
| Email | Email | Contact email used |
| Type | Select | `opportunity_pitch` / `role_inquiry` |
| Status | Select | `pending` / `sent` / `failed` / `replied` |
| Date Sent | Date | ISO date |
| Notes | Text | Error messages + email body |

To mark a reply: open the Notion page and change Status to `replied`.

---

## Development

```bash
npm run dev     # run with tsx (no build step)
npm run build   # compile TypeScript to dist/
npm start       # run compiled output
```

Project structure:

```
src/
├── config/env.ts          — environment variables
├── types/index.ts         — shared TypeScript types
├── prompts/               — Claude prompt templates (easy to tune)
├── services/              — all business logic
│   ├── scraper.ts         — website scraping + email extraction
│   ├── claude.ts          — AI calls (research, email gen, profile parse)
│   ├── notion.ts          — Notion read/write
│   ├── email.ts           — SMTP sending with retry
│   └── profileParser.ts   — CV/resume parsing
└── tools/                 — thin MCP tool wrappers (9 tools)
```

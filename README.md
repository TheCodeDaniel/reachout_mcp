# Cold Outreach MCP

### Your AI-Powered Cold Email Agent — finds companies, writes emails, sends them, logs everything.

> "Stop spending hours manually researching companies and writing outreach emails.
> Paste your CV once. Let the AI find companies that match your skills, write
> human-sounding emails, send them, and track everything in Notion — automatically."

---

## What It Does

Cold Outreach MCP is a custom MCP server that turns Claude into a full outreach automation agent.
You paste your CV once, and Claude can:

1. **Discover** companies that match your skills and background — no manual URL input
2. **Research** each company — scrapes their site, finds contact emails, spots pain points
3. **Recommend** an email type per company — *Opportunity Pitch* or *Role Inquiry*
4. **Ask you to confirm** — you review and approve each recommendation before anything is sent
5. **Generate** emails that sound like a real person wrote them — short, specific, no buzzwords
6. **Send** via Gmail / Outlook / any SMTP provider with a rate limit between sends
7. **Log** every outreach automatically to a Notion database you own

Everything is human-in-the-loop — Claude proposes, you decide, Notion remembers.

---

## Architecture

```
You (Claude Desktop)
        │
        ▼
┌───────────────────────┐
│   Cold Outreach MCP   │  ← This repo
│   (Node.js server)    │
└────────┬──────────────┘
         │
   ┌─────┴──────────────────────┐
   │                            │
   ▼                            ▼
Anthropic API              Notion API
(Claude for research,      (Outreach Tracker DB
 email generation,          read & write)
 company discovery)
         │
         ▼
     SMTP Server
  (Gmail / Outlook /
   any SMTP provider)
```

---

## The 10 MCP Tools

| Tool | What it does |
|---|---|
| `setup_notion_db` | One-time migration — adds all required columns to your Notion database |
| `parse_profile` | Extracts your role, skills, experience and strengths from CV text |
| `discover_companies` | Finds real companies that match your profile — no manual URL input needed |
| `find_company_email` | Scrapes a company's site to find a contact email |
| `research_company` | Analyzes a company — summary, problems spotted, email type recommendation |
| `generate_email` | Writes one outreach email given your profile, company data, and email type |
| `send_email` | Sends an email via SMTP |
| `log_to_notion` | Manually logs an outreach record to Notion |
| `retry_failed` | Re-sends all emails marked "failed" in your Notion tracker |
| `bulk_outreach` | Full pipeline for up to 15 companies at once (two-phase: research → confirm → send) |

---

## Notion Database Schema

> You do **not** need to create these columns manually.
> Run `setup_notion_db` once and it creates everything in your existing database.

| Column | Type | Notes |
|---|---|---|
| Company | Title | Company name |
| Website | URL | Source URL |
| Email | Email | Contact email used |
| Type | Select | `opportunity_pitch` / `role_inquiry` |
| Status | Select | `pending` / `sent` / `failed` / `replied` |
| Date Sent | Date | ISO date |
| Notes | Text | Error messages + full email body |

---

## Email Types

**Opportunity Pitch** — Used when research spotted a specific problem on their site.
> "Your onboarding flow has a few rough edges — I've fixed similar issues before and thought I'd reach out."

**Role Inquiry** — Used when the company looks like a great fit but no clear problem was found.
> "I'm a Flutter developer and your product caught my eye. Just wanted to see if there's room for someone like me."

Both types are kept under 120 words and written to sound like a real person — not a template.

---

## Requirements

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or higher | https://nodejs.org (choose LTS) |
| Git | Any recent version | https://git-scm.com |
| Claude Desktop | Latest | https://claude.ai/download |
| A Notion account | — | https://notion.so |

Verify Node.js and Git are installed by opening a terminal and running:

```bash
node --version   # should print v18.x.x or higher
git --version    # should print git version x.x.x
```

If either says "command not found", install from the links above before continuing.

---

## Setup Guide

### Step 1 — Clone, install and build

```bash
git clone https://github.com/YOUR_USERNAME/cold-outreach-mcp.git
cd cold-outreach-mcp
npm install
npm run build
```

After `npm run build` you should see a `dist/` folder. If you get TypeScript errors, make sure Node.js 18+ is installed.

Note the full path to this folder — you will need it in Step 4:

```bash
# macOS / Linux
pwd

# Windows (PowerShell)
Get-Location
```

---

### Step 2 — Get your API keys

**Anthropic (Claude AI)**
1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Click **Create Key**
3. Copy the key — it starts with `sk-ant-...`

**Notion**
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **+ New integration** → give it a name (e.g. "Cold Outreach") → select your workspace
3. Click **Submit** → copy the **Internal Integration Token** (starts with `ntn_...` or `secret_...`)

**Gmail App Password**
1. Your Google account must have 2-Factor Authentication enabled
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate a password for Mail → copy the 16-character code (use it without spaces)

> **Outlook:** Use `smtp.office365.com`, port `587`, and your regular Microsoft password (or an app password if your org requires it).

---

### Step 3 — Set up your Notion database

1. Go to [notion.so](https://notion.so) and create a new **full-page database** (table view)
2. Copy its ID from the URL:

```
https://notion.so/yourworkspace/My-Database-abc123def456?v=...
                                             ↑
                                    this is your database ID
```

The ID is the 32-character string at the end of the path, before `?v=`.

3. Connect your integration to this database:
   - Open the database in Notion
   - Click `...` (top right) → **Connections** → **Connect to** → select your integration

Keep the database ID handy — you will use it in Step 4.

---

### Step 4 — Register with Claude Desktop

Locate the Claude Desktop config file for your operating system:

| OS | Config file path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

**Open or create the file:**

```bash
# macOS — open in TextEdit
open -a TextEdit ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```bash
# macOS — if the file does not exist yet
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
open -a TextEdit ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```bash
# Linux
mkdir -p ~/.config/Claude
nano ~/.config/Claude/claude_desktop_config.json
```

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude" | Out-Null
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

**Paste this into the file**, replacing all placeholder values with your real data:

```json
{
  "mcpServers": {
    "cold-outreach": {
      "command": "node",
      "args": ["/FULL/PATH/TO/cold-outreach-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "NOTION_API_KEY": "ntn_...",
        "NOTION_DATABASE_ID": "your_database_id",
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "you@gmail.com",
        "SMTP_PASS": "yourapppassword",
        "SENDER_EMAIL": "you@gmail.com",
        "SENDER_NAME": "Your Name"
      }
    }
  }
}
```

Replace `/FULL/PATH/TO/cold-outreach-mcp` with the output of `pwd` from Step 1.

> **Already have other MCP servers?** Add the `"cold-outreach": { ... }` block inside your existing `"mcpServers"` object — do not replace the whole file.

> **Windows path note:** Use double backslashes or forward slashes in the path:
> `"C:\\Users\\you\\cold-outreach-mcp\\dist\\index.js"` or
> `"C:/Users/you/cold-outreach-mcp/dist/index.js"`

---

### Step 5 — Restart Claude Desktop

Fully quit Claude Desktop (not just close the window — use **Quit** from the menu or taskbar).
Reopen it. You should see a **🔨 tools icon** in the chat input bar.

Click the icon to confirm all 10 Cold Outreach tools are listed. If you see zero tools or an error, see the Troubleshooting section below.

---

### Step 6 — Run the Notion migration (once)

In Claude, type:

```
Use setup_notion_db
```

This adds all required columns to your Notion database. It is safe to run again — it will not duplicate anything.

---

## Usage

### Full workflow

The entire flow starts with a single message to Claude. You never paste URLs manually.

**Step 1 — Kick it off**

```
Here is my CV:

[paste your full CV or resume as plain text]

Parse my profile, find 10 companies that match my background, research each one, and show me your recommendations before sending anything.
```

Claude will automatically:
1. Parse your CV into a structured profile
2. Discover matching companies based on your skills
3. Scrape and research each company
4. Return a recommendation per company like this:

```
1. stripe.com
   → Recommended: opportunity_pitch
   → Reason: Checkout onboarding has visible friction — good fit for your UX work

2. linear.app
   → Recommended: role_inquiry
   → Reason: Fast-growing team, no clear gap spotted — strong product match
```

**Step 2 — Confirm and send**

Review the recommendations, then tell Claude which type you want per company:

```
Looks good. Send opportunity_pitch to stripe.com and linear.app, role_inquiry to the rest.
```

Claude runs phase 2 of `bulk_outreach` — generates the emails, sends them, and logs everything to Notion.

---

### Want to narrow the company search?

Add a niche hint to `discover_companies`:

```
Parse my CV, then find 10 companies in the "developer tools" space that match my profile.
[paste CV]
```

Or use the tool directly:
```
Use discover_companies with:
- profile: [your parsed profile]
- niche: "fintech startups"
- count: 10
```

---

### Individual tool commands

**Find a contact email for one company:**
```
Use find_company_email with website_url: "https://somecompany.com"
```

**Research one company:**
```
Use research_company with website_url: "https://somecompany.com"
```

**Send a single email:**
```
Use send_email with:
- to: "contact@somecompany.com"
- subject: "Quick note"
- body: "Hi, ..."
```

**Retry all failed sends:**
```
Use retry_failed
```

---

## Daily Limit

The server enforces a max of **15 companies per `bulk_outreach` call** and adds a **2 second delay** between sends to avoid spam filters.

---

## Testing Without Claude Desktop

### Option 1: MCP Inspector (Recommended)

The MCP Inspector is an official browser-based tool for testing any MCP server interactively — no Claude Desktop required.

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

Pass your environment variables so the tools can connect to real services:

```bash
# macOS / Linux
ANTHROPIC_API_KEY=sk-ant-... \
NOTION_API_KEY=ntn_... \
NOTION_DATABASE_ID=your_id \
SMTP_HOST=smtp.gmail.com \
SMTP_PORT=587 \
SMTP_USER=you@gmail.com \
SMTP_PASS=yourpassword \
SENDER_EMAIL=you@gmail.com \
SENDER_NAME="Your Name" \
npx @modelcontextprotocol/inspector node dist/index.js
```

```powershell
# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
$env:NOTION_API_KEY="ntn_..."
$env:NOTION_DATABASE_ID="your_id"
$env:SMTP_HOST="smtp.gmail.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="you@gmail.com"
$env:SMTP_PASS="yourpassword"
$env:SENDER_EMAIL="you@gmail.com"
$env:SENDER_NAME="Your Name"
npx @modelcontextprotocol/inspector node dist/index.js
```

The Inspector opens in your browser at `http://localhost:5173`. Click **Connect**, then **Tools** to see and call any tool directly.

---

### Option 2: Smoke test (verify the server starts)

```bash
# macOS / Linux
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Windows (PowerShell)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

You should see a JSON response listing all 10 tools. If the server crashes or prints nothing, check your Node.js version with `node --version`.

---

## Troubleshooting

**No 🔨 tools icon in Claude Desktop**
- Make sure you fully quit (not just closed) and reopened Claude Desktop
- Check the config file path is correct for your OS — one wrong character breaks it
- Check the `args` path points to `dist/index.js`, not `src/index.ts`
- On Windows, make sure backslashes are doubled: `\\`

**Tools icon shows but no Cold Outreach tools**
- Open Claude Desktop → Settings → Developer — check for error messages next to `cold-outreach`
- Run the smoke test above to verify the server itself starts correctly
- Check that `npm run build` completed without errors and `dist/index.js` exists

**`setup_notion_db` fails**
- Make sure `NOTION_DATABASE_ID` is set correctly in your Claude Desktop config
- Make sure your Notion integration is connected to the database (not just a page)
- The database ID is 32 characters — double-check you copied the full string

**Emails not sending**
- Gmail: make sure you used an App Password (16 chars, no spaces), not your regular password
- Gmail: 2FA must be enabled on your Google account for App Passwords to work
- Outlook: use `smtp.office365.com`, port `587`
- Check `SMTP_USER`, `SMTP_PASS`, and `SENDER_EMAIL` are all set in the Claude Desktop config

**Claude Desktop config file not found**
The file may not exist yet if you have never configured an MCP server. Create it using the commands in Step 4 above. Make sure the JSON is valid — an extra comma or missing brace will silently break it.

**`discover_companies` returns wrong types of companies**
Add a `niche` hint to narrow it down:
```
Use discover_companies with:
- profile: [your profile]
- niche: "B2B SaaS developer tools"
```

---

## Project Structure

```
src/
├── config/env.ts          — environment variable loading
├── types/index.ts         — shared TypeScript types
├── prompts/               — Claude prompt templates
│   ├── researchPrompt.ts
│   ├── opportunityPitchPrompt.ts
│   └── roleInquiryPrompt.ts
├── services/              — all business logic
│   ├── scraper.ts         — website scraping + email extraction
│   ├── claude.ts          — AI calls (research, email gen, discovery, profile parse)
│   ├── notion.ts          — Notion read/write
│   ├── email.ts           — SMTP sending with retry
│   └── profileParser.ts   — CV/resume parsing
└── tools/                 — MCP tool wrappers (10 tools)
    ├── setupNotion.ts
    ├── parseProfile.ts
    ├── discoverCompanies.ts
    ├── findEmail.ts
    ├── researchCompany.ts
    ├── generateEmail.ts
    ├── sendEmail.ts
    ├── logToNotion.ts
    ├── retryFailed.ts
    └── bulkOutreach.ts
```

---

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk` (official Anthropic SDK)
- **AI**: Anthropic Claude via `@anthropic-ai/sdk` — research, email generation, company discovery
- **Web scraping**: `axios` + `cheerio`
- **Email sending**: `nodemailer` (SMTP)
- **Storage**: Notion REST API (`@notionhq/client`)
- **Host**: Claude Desktop

---

## License

MIT — free to use, fork, and build on.

---

## Author

Built by **Daniel A.** (THECODEDANIEL)

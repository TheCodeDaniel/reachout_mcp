Alright — let's design this like a **real production-level MCP**.
This will be **clean, scalable, and contest-worthy**.

I'll structure this like **real engineering documentation** so you can copy directly.

---

# Cold Outreach MCP — Production Architecture (Node.js)

# 1. Project Overview

## Problem

Developers, designers, and freelancers send **cold outreach emails** to companies manually:

* Find company
* Find email
* Research company
* Write email
* Send email
* Track status

This is slow and painful.

---

## Solution

A **Local MCP Server** that:

* Finds companies
* Finds emails
* Researches company
* Generates AI email (Claude)
* Sends email
* Logs everything to Notion

---

# 2. Core Features

## MVP Features

### 1. Setup Notion Database

Auto-create database schema like migrations

### 2. Profile Parsing

Accept:

* CV file
* Resume text
* Profile text

Extract:

* Skills
* Experience
* Role
* Strengths

---

### 3. Company Research

AI will:

* Visit website
* Analyze product
* Find issues
* Suggest improvements

---

### 4. AI Email Generation

Two Modes:

### Mode 1 — Opportunity Pitch

Example:

"Your checkout page is slow… I can help optimize performance"

---

### Mode 2 — Role Inquiry

Example:

"I'm a Flutter developer… I'd love to join your team"

---

### 5. Auto Email Finder

System tries:

* [contact@domain.com](mailto:contact@domain.com)
* [info@domain.com](mailto:info@domain.com)
* [careers@domain.com](mailto:careers@domain.com)
* [hello@domain.com](mailto:hello@domain.com)

Also:

* scrape website
* check footer
* check contact page

---

### 6. Bulk Outreach

User passes:

* list of URLs
* list of companies

System processes all.

---

### 7. Send Email

Using:

* SMTP
* Gmail
* Outlook

---

### 8. Notion Logging

Every email gets logged:

* company
* email
* status
* message type
* date

---

# 3. Killer Features

## Bulk Outreach

Example:

User:

```
send to:
stripe.com
notion.so
linear.app
```

System:

* finds emails
* researches
* sends all

---

## Auto Email Finder

Scrapes:

* contact page
* footer
* meta tags

---

## Retry Failed Emails

If email fails:

* retry 2 times
* log failure

---

## Future Feature (Reserved)

Email follow-ups:

* send after 3 days
* send after 7 days

---

# 4. Tech Stack (Final)

## Core

Node.js (TypeScript recommended)

---

## Libraries

### MCP

Use:

```
@modelcontextprotocol/sdk
```

---

### AI

Claude API

```
@anthropic-ai/sdk
```

---

### Email

```
nodemailer
```

---

### Scraping

Use:

```
axios
cheerio
playwright (optional advanced)
```

---

### Notion

```
@notionhq/client
```

---

### Env

```
dotenv
```

---

# 5. Project Structure (Production)

```
cold-outreach-mcp/

├── src/
│
│   ├── tools/
│   │   ├── setupNotion.ts
│   │   ├── parseProfile.ts
│   │   ├── findEmail.ts
│   │   ├── researchCompany.ts
│   │   ├── generateEmail.ts
│   │   ├── sendEmail.ts
│   │   ├── bulkOutreach.ts
│   │   ├── logToNotion.ts
│   │   └── retryFailed.ts
│
│   ├── services/
│   │   ├── claude.ts
│   │   ├── notion.ts
│   │   ├── email.ts
│   │   ├── scraper.ts
│   │   └── profileParser.ts
│
│   ├── types/
│   │   └── index.ts
│
│   ├── config/
│   │   └── env.ts
│
│   └── index.ts
│
├── .env
├── package.json
└── README.md
```

Production-ready structure.

---

# 6. MCP Tools Design

## setup_notion_db

Creates database

Fields:

* Company Name
* Website
* Email
* Status
* Type
* Date Sent
* Notes

---

## parse_profile

Input:

* CV path
* text

Output:

```
{
  skills: [],
  experience: [],
  role: ""
}
```

---

## find_company_email

Input:

```
website_url
```

Output:

```
email
```

---

## research_company

Input:

```
website_url
```

Output:

```
{
 product_summary,
 problems,
 suggestions
}
```

---

## generate_email

Input:

```
profile
company
type
```

Output:

```
email_body
```

---

## send_email

Input:

```
email
subject
body
```

Output:

```
success
```

---

## bulk_outreach

Input:

```
company_list
```

Runs:

* find email
* research
* generate
* send

---

## log_to_notion

Logs everything.

---

# 7. Workflow

## Full Flow

```
User Input
   ↓
parse_profile
   ↓
bulk_outreach
   ↓
find_email
   ↓
research_company
   ↓
generate_email
   ↓
send_email
   ↓
log_to_notion
```

Clean architecture.

---

# 8. Notion Database Schema

| Field     | Type   |
| --------- | ------ |
| Company   | Title  |
| Website   | URL    |
| Email     | Email  |
| Type      | Select |
| Status    | Select |
| Date Sent | Date   |
| Notes     | Text   |

---

# Status Options

* pending
* sent
* failed
* replied

---

# Type Options

* opportunity_pitch
* role_inquiry

---

# 9. Environment Variables

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

# 10. Claude Prompt Design

## Opportunity Pitch Prompt

Claude should:

* analyze company
* find issues
* propose help

---

## Role Inquiry Prompt

Claude should:

* introduce user
* highlight skills
* request opportunity

---

# 11. Production Considerations

## Rate Limiting

Avoid:

* sending too many emails

Solution:

* add delay

Example:

```
2 seconds between emails
```

---

## Error Handling

Try:

* retry failed emails

---

## Logging

Console logs:

```
Sending to Stripe...
Success
```

---

# 12. Future UI (Optional Later)

You can add:

* Dashboard
* Analytics
* Outreach history

Stack:

Frontend:

* Next.js

Backend:

* Same MCP

---

# 13. Future Features

* Email followups
* Analytics
* LinkedIn scraping
* Company discovery

---

# 14. Why This Can Win

Because:

* Real problem
* Real automation
* Clean architecture
* Notion integration
* AI usage

This is **contest-level strong**.

---

# Final Rating

Idea: **9.6 / 10**

Winning Potential: **Very High**

---

# Next Step

We should start with:

1. Setup project
2. Setup MCP server
3. Build first tool

Say:

**"Let's start setup"**

and we'll begin building immediately.

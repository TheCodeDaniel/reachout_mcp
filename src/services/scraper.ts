import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedCompany } from "../types/index.js";

// Common email prefixes to try when scraping doesn't find one
const EMAIL_PREFIXES = ["contact", "info", "hello", "team", "careers", "support", "hi"];

// How long we wait before timing out a page request
const REQUEST_TIMEOUT_MS = 10_000;

// Max characters of page text we pass to Claude (keeps tokens manageable)
const MAX_TEXT_LENGTH = 5_000;

// Regex that matches a valid-looking email address in page text
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// Fetches a URL with a browser-like user agent to avoid basic bot blocks
async function fetchPage(url: string): Promise<string> {
  const res = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
    maxRedirects: 5,
  });
  return res.data as string;
}

// Pulls all emails out of a block of text or HTML
function extractEmails(text: string): string[] {
  const found = text.match(EMAIL_REGEX) ?? [];
  // Dedupe and filter out obvious false-positives (image filenames, etc.)
  return [...new Set(found)].filter(
    (e) => !e.endsWith(".png") && !e.endsWith(".jpg") && !e.endsWith(".svg")
  );
}

// Extracts clean readable text from HTML (strips scripts, styles, nav clutter)
function extractText($: cheerio.CheerioAPI): string {
  $("script, style, nav, footer, header, noscript, svg").remove();
  const raw = $("body").text();
  // Collapse whitespace
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

// Tries to guess the company name from the page
function extractCompanyName($: cheerio.CheerioAPI, url: string): string {
  // Try og:site_name, then <title>, then fallback to hostname
  const ogSiteName = $('meta[property="og:site_name"]').attr("content");
  if (ogSiteName) return ogSiteName.trim();

  const title = $("title").text();
  if (title) return title.split(/[|\-–]/)[0].trim();

  // Extract hostname and strip www
  return new URL(url).hostname.replace(/^www\./, "");
}

// Tries to find contact page URLs from the nav or footer
function findContactUrl(baseUrl: string, $: cheerio.CheerioAPI): string | null {
  let contactUrl: string | null = null;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/\/contact|\/about|\/team|\/reach/i.test(href)) {
      try {
        contactUrl = new URL(href, baseUrl).href;
        return false; // break
      } catch {
        // invalid URL, skip
      }
    }
  });
  return contactUrl;
}

// Generates common email guesses from a domain
function guessEmails(domain: string): string[] {
  return EMAIL_PREFIXES.map((prefix) => `${prefix}@${domain}`);
}

// Main scrape function — fetches a company's site and extracts all useful data
export async function scrapeCompany(url: string): Promise<ScrapedCompany> {
  // Ensure the URL has a protocol
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  let html = "";
  try {
    html = await fetchPage(normalizedUrl);
  } catch (err) {
    console.error(`[scraper] Failed to fetch ${normalizedUrl}:`, err);
    // Return a minimal record rather than throwing — callers handle empty data
    return {
      url: normalizedUrl,
      name: new URL(normalizedUrl).hostname.replace(/^www\./, ""),
      textContent: "",
      foundEmails: guessEmails(new URL(normalizedUrl).hostname.replace(/^www\./, "")),
    };
  }

  const $ = cheerio.load(html);
  const name = extractCompanyName($, normalizedUrl);
  const textContent = extractText($);

  // Collect emails from the main page HTML
  const emailsFromPage = extractEmails(html);

  // Try the contact page too if we didn't find emails yet
  let contactEmails: string[] = [];
  if (emailsFromPage.length === 0) {
    const contactUrl = findContactUrl(normalizedUrl, $);
    if (contactUrl) {
      try {
        const contactHtml = await fetchPage(contactUrl);
        contactEmails = extractEmails(contactHtml);
      } catch {
        // contact page failed — not a problem, we'll fall through to guesses
      }
    }
  }

  // Merge page emails + contact page emails, fall back to guesses if still empty
  const domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
  const allFound = [...emailsFromPage, ...contactEmails];
  const foundEmails = allFound.length > 0 ? allFound : guessEmails(domain);

  return { url: normalizedUrl, name, textContent, foundEmails };
}

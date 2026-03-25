import fs from "fs";
import path from "path";
import { parseProfileText } from "./claude.js";
// Accepts either raw text or a file path, and returns a structured UserProfile.
// If a path is given, reads the file first.
export async function parseProfile(input) {
    let text = input;
    // If it looks like a file path and the file exists, read it
    const trimmed = input.trim();
    if ((trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("~")) &&
        !trimmed.includes("\n")) {
        const resolved = trimmed.startsWith("~")
            ? path.join(process.env.HOME ?? "", trimmed.slice(1))
            : path.resolve(trimmed);
        if (fs.existsSync(resolved)) {
            text = fs.readFileSync(resolved, "utf-8");
        }
    }
    return parseProfileText(text);
}
//# sourceMappingURL=profileParser.js.map
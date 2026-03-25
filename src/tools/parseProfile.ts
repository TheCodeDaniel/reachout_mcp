import { parseProfile } from "../services/profileParser.js";

export const parseProfileSchema = {
  name: "parse_profile",
  description:
    "Parses a CV, resume, or profile text and extracts your skills, experience, role, and strengths. Pass either a file path or raw text.",
  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "A file path (e.g. /Users/me/cv.txt) or raw CV/resume text",
      },
    },
    required: ["input"],
  },
};

export async function handleParseProfile(args: { input: string }): Promise<string> {
  const profile = await parseProfile(args.input);
  return JSON.stringify({ success: true, profile });
}

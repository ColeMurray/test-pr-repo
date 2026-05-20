/**
 * Create Pull Request Tool for Open-Inspect.
 *
 * This tool creates a pull request for committed changes.
 * Uses tool() helper from @opencode-ai/plugin with tool.schema for Zod compatibility.
 */
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { bridgeFetch, getSessionId } from "./_bridge-client.js";

const execFileAsync = promisify(execFile);

function readErrorBody(response) {
  return response.text().then((text) => {
    try {
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || text;
    } catch {
      return text;
    }
  });
}

async function getCurrentBranch() {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      timeout: 5000,
    });
    const branch = stdout.trim();
    if (!branch || branch === "HEAD") {
      return undefined;
    }
    return branch;
  } catch (e) {
    return undefined;
  }
}

// Use tool() helper - args should be a ZodRawShape (plain object), NOT a ZodObject
// OpenCode wraps it with z.object() internally
export default tool({
  name: "create-pull-request",
  description:
    "Create a pull request for the committed changes. DO NOT use 'gh' CLI - use this tool instead. It handles git push and PR creation automatically with pre-configured authentication. You MUST provide a descriptive title and body that explain what changes were made. Call this after committing your changes.",
  args: {
    title: z
      .string()
      .describe(
        "Title of the pull request. Should be concise and descriptive of the changes made."
      ),
    body: z
      .string()
      .describe(
        "Body/description of the pull request. Explain what changes were made and why. Use markdown formatting for clarity."
      ),
    baseBranch: z
      .string()
      .optional()
      .describe(
        "Target branch to merge into. Defaults to the repository's default branch (usually 'main')."
      ),
  },
  async execute(args) {
    const title = args.title || "Changes from OpenCode session";
    const body = args.body || "Automated PR created via create-pull-request tool";
    const baseBranch = args.baseBranch; // undefined if not provided, server will use default

    try {
      const sessionId = getSessionId();
      if (!sessionId) {
        return "Failed to create pull request: Session ID not found in environment. Please check that SESSION_CONFIG is set correctly.";
      }

      const headBranch = await getCurrentBranch();
      if (!headBranch) {
        return "Failed to create pull request: Cannot determine current branch. Please run this on a checked-out branch and try again.";
      }

      const response = await bridgeFetch("/pr", {
        method: "POST",
        body: JSON.stringify({
          title: title,
          body: body,
          baseBranch: baseBranch,
          headBranch: headBranch,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        const errorMessage = await readErrorBody(response);

        // Provide helpful messages based on status code
        let userMessage = `Failed to create pull request: ${errorMessage}`;
        if (response.status === 401) {
          userMessage = `Authentication failed: ${errorMessage}. The GitHub token may have expired - please re-authenticate.`;
        } else if (response.status === 404) {
          userMessage = `Session not found: ${errorMessage}. The session may have been deleted or the ID is incorrect.`;
        } else if (response.status === 409) {
          userMessage = `Conflict: ${errorMessage}. A PR may already exist for this branch.`;
        }

        return userMessage;
      }

      let result;
      try {
        result = await response.json();
      } catch {
        return "PR request succeeded, but the response body was not valid JSON.";
      }

      if (result?.status === "manual" && result?.createPrUrl) {
        return `Branch pushed successfully.\n\nCreate the pull request in GitHub:\n${result.createPrUrl}\n\nUse your logged-in GitHub account to finish creating the PR.`;
      }

      return `Pull request created successfully!\n\nPR #${result.prNumber}: ${result.prUrl}\n\nThe PR is now ready for review.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Failed to create pull request: ${message}`;
    }
  },
});

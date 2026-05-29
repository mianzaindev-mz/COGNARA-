/**
 * Support Agent — auto-resolves common support tickets.
 * Handles billing, technical, account, and course issues.
 */

import type { AgentResponse } from "./teach-agent";

export interface SupportAgentInput {
  message: string;
  category?: string;
}

const SUPPORT_REVIEW_RULES = `
For abuse reports, misconduct, plagiarism, harassment, or cheating:
- Do not accuse anyone.
- Summarize the report, evidence needed, involved parties, urgency, and recommended admin action.
- Recommend admin approval before penalties or account/course action.
- If video/live-class evidence is mentioned, ask for timestamp ranges, recording links, chat logs, or attendee names.
- Format answers as polished COGNARA support notes with clear sections and next actions. Do not mention Markdown syntax.`;

export async function runSupportAgent(input: SupportAgentInput): Promise<AgentResponse> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    const GroqModule = await import("groq-sdk");
    const Groq = GroqModule.default || GroqModule.Groq || GroqModule;
    const groq = new Groq({ apiKey: groqKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are COGNARA's support agent. Resolve user issues quickly and clearly.

RULES:
1. Be empathetic but efficient
2. Provide step-by-step solutions
3. If you can't resolve it, tell them a human admin will review within 24 hours
4. Never share internal system details
5. Common resolutions:
   - Password reset: Guide to /forgot-password
   - Credits not showing: Explain daily reset (20 free/day)
   - Course access: Check enrollment status
   - Payment issues: Direct to billing page
   - Verification: Explain the process (upload docs → AI review → admin approval)`,
        },
        { role: "system", content: SUPPORT_REVIEW_RULES },
        { role: "user", content: input.message },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return {
      content: completion.choices?.[0]?.message?.content ?? "Let me connect you with our team.",
      skill: "support",
      tokensUsed: completion.usage?.total_tokens ?? 0,
    };
  }

  return generateSupportFallback(input);
}

function generateSupportFallback(input: SupportAgentInput): AgentResponse {
  const lower = input.message.toLowerCase();
  let content: string;

  if (lower.includes("password") || lower.includes("login") || lower.includes("sign in")) {
    content = `## 🔐 Account Access

**To reset your password:**
1. Go to [Forgot Password](/forgot-password)
2. Enter your email address
3. Check your inbox for the reset link
4. Set a new password (min 8 chars, 1 uppercase, 1 number, 1 special)

**Can't find the email?**
- Check your spam/junk folder
- Make sure you're using the email you registered with
- Try again after 2 minutes

*If you still can't access your account, a human admin will review your case within 24 hours.*`;
  } else if (lower.includes("credit") || lower.includes("balance")) {
    content = `## ⚡ AI Credits

**How credits work:**
- You get **20 free credits** every day (resets at midnight UTC)
- Different actions cost different amounts:
  - Ask a question: 1 credit
  - Debug code: 2 credits
  - Generate quiz: 3 credits

**Need more credits?**
Go to [Billing](/billing) to purchase credit packs:
- 100 credits → $1.99
- 500 credits → $7.99
- 2,000 credits → $24.99

*Purchased credits never expire!*`;
  } else if (lower.includes("course") || lower.includes("enroll")) {
    content = `## 📚 Course Help

**To enroll in a course:**
1. Browse courses at [Catalog](/courses)
2. Click on a course to see details
3. Click "Enroll" (free courses) or "Purchase" (paid)
4. The course appears in [My Courses](/my-courses)

**Course not showing after purchase?**
- Refresh the page
- Check [My Courses](/my-courses) 
- If still missing, it may take up to 5 minutes to process

*For payment-related issues, check [Billing](/billing).*`;
  } else if (lower.includes("verification") || lower.includes("coach") || lower.includes("verified")) {
    content = `## ✅ Coach Verification

**The verification process:**
1. Upload your credentials (degree, certificate, govt ID)
2. Our AI pre-screens documents for authenticity
3. A human admin reviews and makes the final decision
4. You'll be notified via email

**Timeline:** Usually 24-48 hours
**If rejected:** You can appeal with additional documentation

*While pending, you can build courses but cannot publish them.*`;
  } else {
    content = `## 🎫 Support

I've noted your issue. Here's what happens next:

1. **Your ticket has been logged** — we track every request
2. **A human admin will review** within 24 hours
3. **You'll get an email** when there's an update

### Quick Links
- 🔐 [Reset Password](/forgot-password)
- 💳 [Billing & Credits](/billing)
- 📚 [My Courses](/my-courses)
- ⚙️ [Account Settings](/settings)

### Common Solutions
- **Page not loading?** Try refreshing or clearing cache
- **Feature not working?** Check if it's enabled in Settings
- **Payment failed?** Verify your card details in Billing

*Is there anything specific I can help with?*`;
  }

  return { content, skill: "support" };
}

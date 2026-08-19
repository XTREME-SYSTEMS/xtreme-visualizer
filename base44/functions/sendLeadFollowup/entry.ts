import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { base64Url, buildMime } from "../../shared/gmailMime.ts";

const GMAIL_CONNECTOR_ID = "69db200274332486fd28dd7e";

const money = (n: any) =>
  typeof n === "number" ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—";

function getEmailContent(stage: string, lead: any) {
  const name = lead.customer_name || "there";
  const range = `${money(lead.adjusted_low ?? lead.estimate_low)} – ${money(lead.adjusted_high ?? lead.estimate_high)}`;
  const system = lead.system_name || lead.floor_type || "flooring";

  const templates = {
    welcome: {
      subject: `Thanks for reaching out about your flooring project, ${name}`,
      body: `Hi ${name},\n\nThanks for your interest in our flooring services! Based on the information you provided, your preliminary project range for a ${system} floor is ${range}.\n\nWe'd love to schedule a free consultation to see your space and provide a detailed quote. Reply to this email or call us to set up a time that works for you.\n\nBest regards,\nThe Visual-X Team`,
    },
    first_followup: {
      subject: `Following up on your flooring project, ${name}`,
      body: `Hi ${name},\n\nI wanted to follow up on your flooring project inquiry. Have you had a chance to review the preliminary range of ${range}?\n\nI'm happy to answer any questions about the ${system} system, timeline, or scheduling a site visit at your convenience.\n\nBest regards,\nThe Visual-X Team`,
    },
    second_followup: {
      subject: `Your flooring project — still interested, ${name}?`,
      body: `Hi ${name},\n\nJust checking in on your flooring project. We still have availability coming up and would love to work with you.\n\nIf you're ready to move forward or have any questions about the ${system} system, just reply to this email and I'll get right back to you.\n\nBest regards,\nThe Visual-X Team`,
    },
    final_reminder: {
      subject: `Last check-in on your flooring project, ${name}`,
      body: `Hi ${name},\n\nThis will be my last follow-up regarding your flooring project. If you're still interested in the ${system} system, please reach out and we'll be happy to help.\n\nIf now isn't the right time, no worries — we're here whenever you're ready.\n\nBest regards,\nThe Visual-X Team`,
    },
  };

  return templates[stage as keyof typeof templates] || templates.welcome;
}

// Resolve a Gmail access token. Tries APP_USER connection first (what the Admin page connects),
// then falls back to the SHARED connection. Works in both UI and workflow contexts.
async function getGmailToken(base44: any, user: any) {
  // APP_USER: requires a user context (UI calls)
  if (user) {
    try {
      const c = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      if (c?.accessToken) return c.accessToken;
    } catch {}
  }
  // SHARED: works in workflow context (no user) if a shared connection was authorized
  try {
    const c = await base44.asServiceRole.connectors.getConnection("gmail");
    if (c?.accessToken) return c.accessToken;
  } catch {}
  return null;
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    // Auth is OPTIONAL: this function is called from both the UI (user present)
    // and the Lead Follow-up workflow (no user context). Use asServiceRole for all
    // entity operations so RLS doesn't block workflow calls.
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { lead_id, stage } = body;

    if (!lead_id || !stage) {
      return Response.json({ error: "lead_id and stage are required" }, { status: 400 });
    }

    // Use asServiceRole so workflow calls (no user) can read the lead
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // Defense-in-depth: verify ownership ONLY when a user is present (UI calls).
    // Workflow calls have no user and are trusted (triggered by the platform).
    if (user && lead.created_by_id !== user.id && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Skip if lead is already won or lost
    if (lead.status === "won" || lead.status === "lost") {
      return Response.json({ ok: true, skipped: true, reason: `lead status is ${lead.status}` });
    }

    // Skip if lead has no email
    if (!lead.email) {
      return Response.json({ ok: true, skipped: true, reason: "lead has no email" });
    }

    const { subject, body: emailBody } = getEmailContent(stage, lead);

    // Send via Gmail connector (APP_USER or SHARED)
    let emailSent = false;
    let sendError = null;
    const accessToken = await getGmailToken(base44, user);
    if (accessToken) {
      try {
        const fromEmail = user?.email || "Visual-X Team <noreply@visual-x.app>";
        const mime = buildMime({ from: fromEmail, to: lead.email, subject, text: emailBody });
        const raw = base64Url(mime);
        const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        if (r.ok) {
          emailSent = true;
        } else {
          const data = await r.json();
          sendError = data.error?.message || "send failed";
        }
      } catch (e: any) {
        sendError = e.message;
      }
    } else {
      sendError = "Gmail not connected";
    }

    // Create a MessageTemplate record (asServiceRole for workflow compatibility)
    const template = await base44.asServiceRole.entities.MessageTemplate.create({
      lead_id: lead_id,
      template_type: stage === "welcome" ? "clarification" : stage === "first_followup" ? "reminder" : stage === "second_followup" ? "viewed_no_response" : "lost_feedback",
      subject: subject,
      body: emailBody,
      status: emailSent ? "sent" : "draft",
    });

    // Update the lead's follow-up stage (asServiceRole for workflow compatibility)
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      follow_up_stage: stage + "_sent",
      last_contacted_date: new Date().toISOString(),
      status: lead.status === "new" ? "qualified" : lead.status,
    });

    return Response.json({
      ok: true,
      stage: stage,
      email_sent: emailSent,
      send_error: sendError,
      template_id: template.id,
    });
  } catch (error: any) {
    console.error("sendLeadFollowup error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
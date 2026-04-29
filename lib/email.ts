import "server-only";
import nodemailer from "nodemailer";
import type { LeadRecord } from "./db";
import type { Recommendation } from "./recommend";

/**
 * Sends a confirmation email to the lead.
 * Falls back to console.log in dev if SMTP env vars are not set.
 *
 * ENV:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   BOOKING_URL  (Planity link, default https://www.planity.com)
 *   BRAND_NAME   (default "Body Institut")
 *   BRAND_REPLY_TO (default contact@bodyinstitut.fr)
 */

let transporter: nodemailer.Transporter | null = null;
let initialized = false;

function getTransporter() {
  if (initialized) return transporter;
  initialized = true;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    console.info("[email] SMTP not configured — emails will be logged only.");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth:
      SMTP_USER && SMTP_PASS
        ? { user: SMTP_USER, pass: SMTP_PASS }
        : undefined,
  });
  return transporter;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface ConfirmationContext {
  lead: LeadRecord;
  bookingUrl?: string;
}

export function buildConfirmationEmail({ lead, bookingUrl }: ConfirmationContext) {
  const brand = process.env.BRAND_NAME || "Body Institut";
  const url = bookingUrl || process.env.BOOKING_URL || "https://www.planity.com";
  const total = (lead.price_total ?? lead.price_cure ?? 0).toLocaleString("fr-FR");
  const session = (lead.price_session ?? 0).toLocaleString("fr-FR");
  const cure = (lead.price_cure ?? 0).toLocaleString("fr-FR");

  const subject = `${brand} — Votre analyse personnalisée est prête`;

  const text = `Bonjour ${lead.first_name},

Merci d'avoir réalisé votre simulation ${brand}.

Voici votre analyse :
• Soin recommandé : ${lead.simulator}
• Objectif : ${lead.goal}
• Zone ciblée : ${lead.zone}
• Protocole : ${lead.protocol ?? "—"}
• Résultat attendu : ${lead.result ?? "—"}
• Prix séance : ${session} €
• Prix cure : ${cure} €
• Total estimé : ${total} €${lead.duo_applied ? ` (offre duo cures appliquée)` : ``}
${lead.analysis ? `\nAnalyse :\n${lead.analysis}\n` : ""}
Prenez rendez-vous pour votre bilan offert :
${url}

À très vite,
L'équipe ${brand}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#0a0a0c;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0c;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#16161a 0%,#0a0a0c 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
        <tr><td style="padding:32px 36px 8px 36px;">
          <p style="margin:0;text-transform:uppercase;letter-spacing:0.28em;font-size:11px;color:rgba(255,255,255,0.45);">${escapeHtml(brand)}</p>
          <h1 style="margin:14px 0 0 0;font-size:34px;line-height:1.1;letter-spacing:-0.025em;color:#fff;font-weight:600;">
            Bonjour ${escapeHtml(lead.first_name)},<br>
            <span style="color:rgba(255,255,255,0.55)">votre protocole est prêt.</span>
          </h1>
        </td></tr>

        <tr><td style="padding:24px 36px 8px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Soin recommandé", lead.simulator)}
            ${row("Objectif", lead.goal)}
            ${row("Zone ciblée", lead.zone)}
            ${lead.protocol ? row("Protocole", lead.protocol) : ""}
            ${lead.result ? row("Résultat attendu", lead.result) : ""}
            ${lead.price_session ? row("Prix séance", `${session} €`) : ""}
            ${lead.price_cure ? row("Prix cure", `${cure} €`) : ""}
            ${row(lead.duo_applied ? "Total après offre duo" : "Total estimé", `${total} €`)}
          </table>
        </td></tr>

        ${
          lead.analysis
            ? `<tr><td style="padding:8px 36px 16px 36px;">
                <p style="margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.28em;font-size:11px;color:rgba(255,255,255,0.45);">Analyse</p>
                <p style="margin:0;font-size:15px;line-height:1.55;color:rgba(255,255,255,0.85);">${escapeHtml(
                  lead.analysis
                )}</p>
              </td></tr>`
            : ""
        }

        <tr><td align="center" style="padding:28px 36px 36px 36px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;font-weight:500;font-size:15px;padding:16px 28px;border-radius:999px;">
            Réserver mon bilan offert &rarr;
          </a>
          <p style="margin:18px 0 0 0;font-size:12px;color:rgba(255,255,255,0.4);">2 minutes • Sans engagement</p>
        </td></tr>

        <tr><td style="padding:0 36px 28px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:18px 0 0 0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">
            Vous recevez ce mail suite à votre simulation sur ${escapeHtml(brand)}.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
      <span style="text-transform:uppercase;letter-spacing:0.22em;font-size:10px;color:rgba(255,255,255,0.45);">${escapeHtml(label)}</span>
    </td>
    <td align="right" style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
      <span style="font-size:15px;color:#fff;font-weight:500;">${escapeHtml(value)}</span>
    </td>
  </tr>`;
}

export async function sendConfirmationEmail(ctx: ConfirmationContext) {
  const t = getTransporter();
  const { subject, text, html } = buildConfirmationEmail(ctx);
  const from =
    process.env.SMTP_FROM ||
    `${process.env.BRAND_NAME || "Body Institut"} <no-reply@bodyinstitut.fr>`;
  const replyTo = process.env.BRAND_REPLY_TO || "contact@bodyinstitut.fr";

  if (!t) {
    console.info("[email:logged]", { to: ctx.lead.email, subject });
    return { ok: false, reason: "smtp_not_configured" as const };
  }

  try {
    await t.sendMail({
      from,
      to: ctx.lead.email,
      replyTo,
      subject,
      text,
      html,
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false as const, reason: "send_failed" };
  }
}

/* ────────── Admin notification ────────── */

export interface AdminNotificationContext {
  lead: LeadRecord;
  recommendation: Recommendation;
}

export async function sendAdminNotificationEmail(
  ctx: AdminNotificationContext
) {
  const t = getTransporter();
  const brand = process.env.BRAND_NAME || "Body Institut";
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.BRAND_REPLY_TO;
  if (!adminTo) {
    console.info("[email:admin] No ADMIN_NOTIFY_EMAIL set — skipping.");
    return { ok: false as const, reason: "no_recipient" };
  }

  const { lead, recommendation: rec } = ctx;
  const total = (lead.price_total ?? 0).toLocaleString("fr-FR");
  const subject = `🔔 Nouveau lead — ${lead.first_name} ${lead.last_name} · ${lead.simulator} · ${total} €`;

  const lines = [
    `Nouveau lead Body Institut`,
    ``,
    `${lead.first_name} ${lead.last_name}`,
    `📧 ${lead.email}`,
    `📞 ${lead.phone}`,
    lead.city ? `📍 ${lead.city}` : "",
    lead.age ? `🎂 ${lead.age} ans${lead.sex ? ` · ${lead.sex}` : ""}` : "",
    lead.height_cm && lead.weight_kg
      ? `📏 ${lead.height_cm} cm · ${lead.weight_kg} kg`
      : "",
    ``,
    `── Simulation ──`,
    `Soin       : ${lead.simulator}`,
    `Objectif   : ${lead.goal}`,
    `Zone       : ${lead.zone}${lead.zone_tier ? ` (${lead.zone_tier})` : ""}`,
    `Intensité  : ${lead.intensity ?? "—"}`,
    `Sport      : ${lead.sport ?? "—"}`,
    lead.cellulite ? `Cellulite  : ${lead.cellulite}` : "",
    lead.budget_client ? `Budget     : ${lead.budget_client}` : "",
    ``,
    `── Recommandation ──`,
    `Protocole  : ${lead.protocol ?? "—"}`,
    `Prix séance: ${lead.price_session ?? 0} €`,
    `Prix cure  : ${lead.price_cure ?? 0} €`,
    rec.duo
      ? `Duo cures  : ${rec.complementary?.simulatorName} · −${rec.duo.discount} €`
      : "",
    `TOTAL      : ${total} €`,
    ``,
    lead.message ? `── Message client ──\n${lead.message}\n` : "",
    lead.analysis ? `── Analyse IA ──\n${lead.analysis}\n` : "",
    lead.availability ? `Disponibilités : ${lead.availability}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!t) {
    console.info("[email:admin:logged]", { to: adminTo, subject });
    return { ok: false as const, reason: "smtp_not_configured" };
  }

  try {
    await t.sendMail({
      from:
        process.env.SMTP_FROM ||
        `${brand} <no-reply@bodyinstitut.fr>`,
      to: adminTo,
      replyTo: lead.email,
      subject,
      text: lines,
    });
    return { ok: true as const };
  } catch (err) {
    console.error("[email:admin] send failed", err);
    return { ok: false as const, reason: "send_failed" };
  }
}

import { Resend } from "resend";
import { EVENT_NAME, EVENT_TAGLINE, VENUE, formatSessionDate, formatTimeLabel } from "@/lib/event";

type InviteEmailInput = {
  to: string;
  names: string[];
  pax: number;
  confirmationCode: string;
  eventDate: string;
  startsAt: string;
  slotLabel: string;
};

function engravedNames(names: string[]) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export async function sendInvitationEmail(input: InviteEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Kind Table <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY missing — skipping email");
    return { skipped: true as const };
  }

  const resend = new Resend(apiKey);
  const when = `${formatSessionDate(input.eventDate)} · ${formatTimeLabel(input.startsAt, input.slotLabel)}`;
  const partyLine = input.pax > 1 ? `<p style="letter-spacing:0.12em;text-transform:uppercase;color:#5a7a68;font-size:12px;">Party of ${input.pax}</p>` : "";

  const html = `
  <div style="font-family:Georgia,serif;background:#14201c;padding:32px 16px;">
    <div style="max-width:440px;margin:0 auto;background:linear-gradient(145deg,#c9a85c,#e8d5a3,#b8954a);padding:8px;">
      <div style="background:#faf6ee;padding:36px 28px;text-align:center;color:#1e322a;">
        <p style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#6b7f72;margin:0 0 12px;">You are cordially invited</p>
        <h1 style="font-size:36px;margin:0;color:#2a3f36;">${EVENT_NAME}</h1>
        <p style="letter-spacing:0.12em;text-transform:uppercase;color:#7a6a4a;font-size:13px;">${EVENT_TAGLINE}</p>
        <p style="font-style:italic;color:#8a7a62;margin:24px 0 8px;">engraved for</p>
        <p style="font-size:28px;font-style:italic;margin:0 0 8px;">${engravedNames(input.names)}</p>
        ${partyLine}
        <p style="margin:24px 0 8px;line-height:1.5;">${when}</p>
        <p style="font-size:13px;color:#7a6f60;line-height:1.5;margin:0 0 20px;">
          ${VENUE.name}<br/>${VENUE.address}
        </p>
        <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a8e7c;margin:0;">
          Confirmation <strong style="color:#6b5a38;letter-spacing:0.14em;">${input.confirmationCode}</strong>
        </p>
      </div>
    </div>
  </div>`;

  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `Your ${EVENT_NAME} invitation — ${input.confirmationCode}`,
    html,
  });

  if (error) throw new Error(error.message);
  return { skipped: false as const };
}

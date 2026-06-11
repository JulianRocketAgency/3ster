import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mijndomein.nl",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("nl-NL", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : "";
}

export async function sendReservationConfirmation({ name, email, date, time, guests, notes }) {
  // Logo als bijlage — cid referentie in de HTML
  let logoAttachment = null;
  try {
    const logoPath = join(__dirname, "../../../public/rocket-agency-transparent.png");
    const logoData = readFileSync(logoPath);
    logoAttachment = {
      filename: "rocket-agency.png",
      content: logoData,
      cid: "rocket-agency-logo",
    };
  } catch(e) {
    console.warn("Logo niet gevonden:", e.message);
  }

  const html = `
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reserveringsbevestiging</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#1d1d1f;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">De 3 Ster</p>
              <p style="margin:6px 0 0;font-size:13px;color:#86868b;letter-spacing:2px;text-transform:uppercase;">Eetcafé · Otterlo</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1d1d1f;">Bedankt voor uw reservering!</p>
              <p style="margin:0 0 32px;font-size:15px;color:#86868b;line-height:1.6;">Beste ${name}, uw reservering bij De 3 Ster is in goede orde ontvangen. Hieronder vindt u een overzicht.</p>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;border-radius:12px;overflow:hidden;margin-bottom:32px;">
                <tr><td style="padding:24px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e5ea;">
                      <span style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Datum</span><br>
                      <span style="font-size:15px;font-weight:600;color:#1d1d1f;text-transform:capitalize;">${formatDate(date)}</span>
                    </td></tr>
                    <tr><td style="padding:8px 0;border-bottom:1px solid #e5e5ea;">
                      <span style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Tijd</span><br>
                      <span style="font-size:15px;font-weight:600;color:#1d1d1f;">${formatTime(time)}</span>
                    </td></tr>
                    <tr><td style="padding:8px 0${notes ? ";border-bottom:1px solid #e5e5ea" : ""};">
                      <span style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Aantal personen</span><br>
                      <span style="font-size:15px;font-weight:600;color:#1d1d1f;">${guests} ${parseInt(guests) === 1 ? "persoon" : "personen"}</span>
                    </td></tr>
                    ${notes ? `<tr><td style="padding:8px 0;">
                      <span style="font-size:12px;color:#86868b;text-transform:uppercase;letter-spacing:0.5px;">Opmerking</span><br>
                      <span style="font-size:15px;color:#1d1d1f;">${notes}</span>
                    </td></tr>` : ""}
                  </table>
                </td></tr>
              </table>

              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f4fd;border-radius:10px;margin-bottom:32px;">
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0;font-size:13px;color:#1d6fa8;line-height:1.6;">
                    <strong>Let op:</strong> uw reservering wordt zo snel mogelijk bevestigd door ons team. Neem bij vragen contact op via <a href="tel:+31318592166" style="color:#1d6fa8;">+31 318 592 166</a>.
                  </p>
                </td></tr>
              </table>

              <!-- Adres -->
              <p style="margin:0;font-size:14px;color:#86868b;line-height:1.8;">
                <strong style="color:#1d1d1f;">De 3 Ster</strong><br>
                Kerklaan 13-15<br>
                6731 BA Otterlo<br>
                <a href="tel:+31318592166" style="color:#0071e3;text-decoration:none;">+31 318 592 166</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f7;padding:24px 40px;border-top:1px solid #e5e5ea;text-align:center;">
              <p style="margin:0 0 12px;font-size:11px;color:#aeaeb2;">Reserveringssysteem mogelijk gemaakt door</p>
              ${logoAttachment ? `<img src="cid:rocket-agency-logo" alt="Rocket Agency" style="height:36px;width:auto;" />` : `<strong style="color:#1d1d1f;">Rocket Agency</strong>`}
              <p style="margin:8px 0 0;">
                <a href="https://www.rocket-agency.nl" style="font-size:11px;color:#aeaeb2;text-decoration:none;">www.rocket-agency.nl</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"De 3 Ster" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Reservering ontvangen — De 3 Ster`,
    html,
    attachments: logoAttachment ? [logoAttachment] : [],
  });

  console.log(`✅ Bevestigingsmail verstuurd naar ${email}`);
}

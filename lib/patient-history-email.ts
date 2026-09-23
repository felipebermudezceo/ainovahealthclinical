import { INSTITUTION } from "@/lib/institution";

const FONT = "Arial, Helvetica, sans-serif";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function logoImage(size: number): string {
  return `<img src="cid:ainovahealth-logo" width="${size}" height="${size}" alt="AinovaHealth Medical" style="display:block;border:0;outline:none;text-decoration:none;width:${size}px;height:${size}px;">`;
}

export function buildPatientHistoryEmail(): { html: string; text: string } {
  const address = escapeHtml(INSTITUTION.address);
  const locality = escapeHtml(INSTITUTION.locality);
  const city = escapeHtml(INSTITUTION.city);
  const phone = escapeHtml(INSTITUTION.phone);
  const headerLogo = logoImage(48);
  const footerLogo = logoImage(28);

  const text = [
    "Hola, estimado paciente:",
    "",
    "Adjuntamos tu historia clínica correspondiente a la atención recibida en AinovaHealth Medical.",
    "",
    "Este documento contiene la información clínica relacionada con tu consulta.",
    "",
    "Tu historia clínica está adjunta a este correo en formato PDF.",
    "",
    "Gracias por confiar en AinovaHealth Medical.",
    "",
    "Historia clínica",
    "AinovaHealth Medical",
    "Documento PDF",
    "",
    "Información confidencial",
    "Este correo y su documento adjunto contienen información clínica privada y están destinados exclusivamente al paciente. Si recibiste este mensaje por error, por favor elimínalo y evita compartir su contenido.",
    "",
    "AinovaHealth Medical",
    INSTITUTION.address,
    INSTITUTION.locality,
    INSTITUTION.city,
    INSTITUTION.phone,
    "Gracias por confiar en AinovaHealth Medical.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historia clínica — AinovaHealth Medical</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5f4;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #d5dfdc;border-radius:16px;">
          <tr>
            <td style="padding:28px 28px 20px 28px;background-color:#f7faf9;border-bottom:1px solid #d5dfdc;border-radius:16px 16px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:14px;">${headerLogo}</td>
                  <td valign="middle" style="font-family:${FONT};font-size:20px;line-height:26px;font-weight:bold;color:#1b5650;">AinovaHealth Medical</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;font-family:${FONT};font-size:16px;line-height:24px;color:#1c2b29;">Hola, estimado paciente:</td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0 28px;font-family:${FONT};font-size:15px;line-height:24px;color:#1c2b29;">Adjuntamos tu historia clínica correspondiente a la atención recibida en AinovaHealth Medical.</td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0 28px;font-family:${FONT};font-size:15px;line-height:24px;color:#1c2b29;">Este documento contiene la información clínica relacionada con tu consulta.</td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0 28px;font-family:${FONT};font-size:15px;line-height:24px;color:#1c2b29;">Tu historia clínica está adjunta a este correo en formato PDF.</td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0 28px;font-family:${FONT};font-size:15px;line-height:24px;color:#1c2b29;">Gracias por confiar en AinovaHealth Medical.</td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7faf9;border:1px solid #d5dfdc;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" width="52" style="width:52px;padding-right:14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="52" height="52" align="center" valign="middle" bgcolor="#1b5650" style="width:52px;height:52px;background-color:#1b5650;border-radius:10px;font-family:${FONT};font-size:12px;line-height:16px;font-weight:bold;letter-spacing:0.04em;color:#ffffff;">PDF</td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle" style="font-family:${FONT};">
                          <div style="font-size:16px;line-height:22px;font-weight:bold;color:#1c2b29;">Historia clínica</div>
                          <div style="padding-top:2px;font-size:14px;line-height:20px;color:#1b5650;">AinovaHealth Medical</div>
                          <div style="padding-top:2px;font-size:13px;line-height:18px;color:#5d6d6a;">Documento PDF</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #d5dfdc;">
                <tr>
                  <td style="padding-top:16px;font-family:${FONT};font-size:12px;line-height:18px;font-weight:bold;color:#5d6d6a;">Información confidencial</td>
                </tr>
                <tr>
                  <td style="padding-top:4px;font-family:${FONT};font-size:12px;line-height:18px;color:#5d6d6a;">Este correo y su documento adjunto contienen información clínica privada y están destinados exclusivamente al paciente. Si recibiste este mensaje por error, por favor elimínalo y evita compartir su contenido.</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 24px 28px;background-color:#f7faf9;border-top:1px solid #d5dfdc;border-radius:0 0 16px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="padding-right:12px;">${footerLogo}</td>
                  <td valign="top" style="font-family:${FONT};font-size:13px;line-height:20px;color:#5d6d6a;">
                    <div style="font-size:14px;line-height:20px;font-weight:bold;color:#1b5650;">AinovaHealth Medical</div>
                    <div>${address}</div>
                    <div>${locality}</div>
                    <div>${city}</div>
                    <div>Tel: ${phone}</div>
                    <div style="padding-top:8px;color:#1c2b29;">Gracias por confiar en AinovaHealth Medical.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}

import nodemailer from 'nodemailer';
import config from '../config';

// ─── Template Types ───────────────────────────────────────────────────────────

export type TEmailButton = {
    label: string;
    url: string;
}; 

export type TEmailPayload = {
    to: string;
    subject: string;
    heading: string;
    subheading?: string;
    body: string;           // supports plain text or simple HTML paragraphs
    button?: TEmailButton;
    footerNote?: string;
};

// ─── Template Builder ─────────────────────────────────────────────────────────

const buildEmailTemplate = (payload: TEmailPayload): string => {
    const { heading, subheading, body, button, footerNote } = payload;

    const buttonHtml = button
        ? `
        <tr>
            <td align="center" style="padding: 24px 0 8px;">
                <a href="${button.url}"
                   target="_blank"
                   style="
                       display: inline-block;
                       background-color: #4f46e5;
                       color: #ffffff;
                       text-decoration: none;
                       font-size: 15px;
                       font-weight: 600;
                       padding: 13px 32px;
                       border-radius: 8px;
                       letter-spacing: 0.3px;
                   ">
                    ${button.label}
                </a>
            </td>
        </tr>`
        : '';

    const subheadingHtml = subheading
        ? `<p style="margin: 6px 0 0; font-size: 15px; color: #6b7280;">${subheading}</p>`
        : '';

    const footerNoteHtml = footerNote
        ? `<p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">${footerNote}</p>`
        : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${heading}</title>
    <!--[if mso]>
    <noscript>
        <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#f3f4f6; padding: 40px 16px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="max-width:560px; background-color:#ffffff; border-radius:12px;
                              box-shadow:0 1px 4px rgba(0,0,0,0.08); overflow:hidden;">

                    <!-- Header bar -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                                   padding: 28px 32px; text-align:center;">
                            <h1 style="margin:0; font-size:22px; font-weight:700;
                                       color:#ffffff; letter-spacing:-0.3px;">
                                Maaza International
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 32px 8px;">

                            <!-- Heading -->
                            <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 700;
                                       color: #111827; line-height: 1.3;">
                                ${heading}
                            </h2>
                            ${subheadingHtml}

                            <!-- Divider -->
                            <hr style="border:none; border-top:1px solid #e5e7eb; margin: 20px 0;" />

                            <!-- Main content -->
                            <div style="font-size: 15px; color: #374151; line-height: 1.7;">
                                ${body}
                            </div>

                        </td>
                    </tr>

                    <!-- CTA Button -->
                    ${buttonHtml
                        ? `<tr><td style="padding: 10px 32px; margin: 0 auto;">${buttonHtml.replace(/<tr>|<\/tr>|<td[^>]*>|<\/td>/g, '')}</td></tr>`
                        : ''}

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px 32px; border-top: 1px solid #f3f4f6; margin-top: 24px;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                                This email was sent by <strong>Maaza International</strong>.
                                If you did not request this, please ignore this email.
                            </p>
                            ${footerNoteHtml}
                        </td>
                    </tr>

                </table>

                <!-- Bottom caption -->
                <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af; text-align:center;">
                    &copy; ${new Date().getFullYear()} Maaza International. All rights reserved.
                </p>

            </td>
        </tr>
    </table>

</body>
</html>`;
};

// ─── Transporter ──────────────────────────────────────────────────────────────

const createTransporter = () =>
    nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: config.NODE_ENV === 'production',
        auth: {
            // user: 'maazainternatinale@gmail.com',
            user: config.smtp_user,
            pass: config.smtp_pass,
        },
    });

// ─── Send Email ───────────────────────────────────────────────────────────────

export const sendEmail = async (payload: TEmailPayload): Promise<void> => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"Maaza International" maazainternatinale@gmail.com`,
        to: payload.to,
        subject: payload.subject,
        html: buildEmailTemplate(payload),
    });
};

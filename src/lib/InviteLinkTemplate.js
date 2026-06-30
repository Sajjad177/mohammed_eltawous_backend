export const InviteLinkTemplate = (inviteLink) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invitation</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f6f9;">
          <tr>
              <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0"
                      style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);">

                      <!-- Header -->
                      <tr>
                          <td style="background:#2563eb;padding:30px;text-align:center;">
                              <h1 style="margin:0;color:#ffffff;font-size:24px;">
                                  You're Invited!
                              </h1>
                          </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                          <td style="padding:40px 35px;">

                              <p style="margin:0 0 20px;font-size:16px;color:#333;">
                                  Hello,
                              </p>

                              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#555;">
                                  You have been invited to access and edit shared information on our platform.
                              </p>

                              <p style="margin:0 0 30px;font-size:15px;line-height:1.7;color:#555;">
                                  Click the button below to open your invitation.
                              </p>

                              <div style="text-align:center;margin:35px 0;">
                                  <a href="${inviteLink}"
                                      style="
                                      background:#2563eb;
                                      color:#ffffff;
                                      text-decoration:none;
                                      padding:14px 32px;
                                      border-radius:6px;
                                      display:inline-block;
                                      font-size:16px;
                                      font-weight:bold;
                                      ">
                                      Open Invitation
                                  </a>
                              </div>

                              <p style="margin:30px 0 10px;font-size:14px;color:#666;">
                                  If the button doesn't work, copy and paste the following link into your browser:
                              </p>

                              <p style="word-break:break-all;font-size:13px;color:#2563eb;">
                                  ${inviteLink}
                              </p>

                              <hr style="margin:35px 0;border:none;border-top:1px solid #e5e7eb;" />

                              <p style="font-size:13px;color:#777;line-height:1.6;">
                                  This invitation was sent specifically to you. Please do not share this link with others.
                              </p>

                          </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                          <td style="background:#f8fafc;padding:20px;text-align:center;">
                              <p style="margin:0;font-size:13px;color:#777;">
                                  © ${new Date().getFullYear()} Your Company. All rights reserved.
                              </p>
                          </td>
                      </tr>

                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;
};

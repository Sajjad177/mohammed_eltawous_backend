import { companyName } from './companyName.js';

export const verificationCodeTemplate = (code) => `
  <div
    style="
      padding: 40px 20px;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    "
  >
    <table
      align="center"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      "
    >
      <!-- Header -->
      <tr>
        <td
          align="center"
          style="
            background-color: #1c7474ff;
            padding: 22px 20px;
          "
        >
          <h1
            style="
              color: #ffffff;
              margin: 0;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: 0.5px;
            "
          >
            ${companyName}
          </h1>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding: 32px 24px; text-align: center">

          <h2
            style="
              color: #111827;
              font-size: 20px;
              margin: 0 0 12px;
              font-weight: 700;
            "
          >
            Verify Your Account
          </h2>

          <p
            style="
              color: #6b7280;
              font-size: 14px;
              margin: 0 0 22px;
              line-height: 1.5;
            "
          >
            Use the verification code below to complete your action.
            This code will expire in <strong>5 minutes</strong>.
          </p>

          <!-- Code Box -->
          <div
            style="
              display: inline-block;
              background-color: #10b981;
              padding: 14px 28px;
              border-radius: 8px;
              margin: 10px 0 24px;
            "
          >
            <span
              style="
                font-size: 22px;
                font-weight: 700;
                color: #000000;
                letter-spacing: 4px;
              "
            >
              ${code}
            </span>
          </div>

          <p
            style="
              color: #374151;
              font-size: 13px;
              margin-top: 10px;
            "
          >
            Do not share this code with anyone for security reasons.
          </p>

          <p
            style="
              color: #111827;
              font-size: 14px;
              font-weight: 600;
              margin-top: 28px;
            "
          >
            Best regards,<br />
            The ${companyName} Team
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td
          align="center"
          style="
            background-color: #1c7474ff;
            color: #ffffff;
            font-size: 12px;
            padding: 16px;
          "
        >
          <p style="margin: 0">Need help? Contact support anytime</p>
          <p style="margin: 6px 0 0">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

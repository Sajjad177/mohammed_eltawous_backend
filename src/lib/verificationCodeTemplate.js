const { companyName } = require('./companyName');

const verificationCodeTemplate = (code) => `
    <div
      style="
        background-color: #008b8b;
        margin-top: 50px;
        padding: 4px 20px;
        font-family: &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
      "
    >
      <table
        align="center"
        cellpadding="0"
        cellspacing="0"
        width="100%"
        style="background-color: #ffffff; border-radius: 4px; overflow: hidden"
      >
        <!-- Header -->
        <tr>
          <td align="center" style="background-color: #008b8b; padding: 20px 0">
            <h1
              style="
                color: #ffffff;
                margin: 0;
                font-size: 22px;
                font-weight: 600;
              "
            >
              ${companyName}
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 30px 15px; text-align: left">
            <h2
              style="
                color: #111827;
                font-size: 22px;
                margin: 0 0 16px;
                font-weight: 700;
              "
            >
              Your Verification code is:
            </h2>

            <p style="color: #374151; font-size: 13px; margin: 0 0 20px">
              Please note: Do not share this code with anyone. This one-time
              code will expire in <strong>5 minutes.</strong>
            </p>

            <table
              align="center"
              width="60%"
              cellpadding="0"
              cellspacing="0"
              style="
                background-color: #f3f4f6;
                border-radius: 8px;
                margin: 24px auto;
              "
            >
              <tr>
                <td align="center" style="padding: 14px 0">
                  <span
                    style="
                      font-size: 24px;
                      font-weight: bold;
                      color: #111827;
                      letter-spacing: 3px;
                    "
                  >
                    ${code}
                  </span>
                </td>
              </tr>
            </table>

            <p
              style="
                color: #111827;
                font-size: 14px;
                font-weight: 500;
                margin-top: 24px;
              "
            >
              Best,<br />
              The ${companyName} Team
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td
            align="center"
            style="
              background-color: #008b8b;
              color: #ffffff;
              font-size: 12px;
              padding: 16px;
            "
          >
            <p style="margin: 0">Contact us at contact@instrufix.com</p>
            <p style="margin: 6px 0 0">
              &copy; ${new Date().getFullYear()} ${companyName}. All rights
              reserved.
            </p>
          </td>
        </tr>
      </table>
    </div>
`;

module.exports = verificationCodeTemplate;

export const getMailTemplate = ({
  firstName,
  lastName,
  email,
  type,
  subject,
  message,
  recipient = 'user'
}) => {
  const requestType =
    type === 'support' ? 'Support Request' : 'Subscription Request';

  const isAdmin = recipient === 'admin';

  return `
  <div
    style="
      max-width: 700px;
      margin: 0 auto;
      font-family: Arial, Helvetica, sans-serif;
      color: #333333;
      line-height: 1.6;
    "
  >
    <div style="padding-bottom: 16px; border-bottom: 1px solid #e5e5e5;">
      <h2
        style="
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #222222;
        "
      >
        ${requestType}
      </h2>
    </div>

    <div style="margin-top: 24px;">
      ${
        isAdmin
          ? `
            <p>
              A new ${requestType.toLowerCase()} has been submitted and requires review.
            </p>
          `
          : `
            <p>Dear ${firstName} ${lastName},</p>

            <p>
              Thank you for contacting us. We have successfully received your request.
              Our team will review the information provided and respond as soon as possible.
            </p>
          `
      }
    </div>

    <div style="margin-top: 24px;">
      <h3
        style="
          font-size: 18px;
          margin-bottom: 12px;
          color: #222222;
        "
      >
        Request Details
      </h3>

      <table
        style="
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #dddddd;
        "
      >
        <tr>
          <td style="padding: 10px; border: 1px solid #dddddd; width: 180px;">
            <strong>First Name</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            ${firstName}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            <strong>Last Name</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            ${lastName}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            <strong>Email Address</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            ${email}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            <strong>Request Type</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            ${requestType}
          </td>
        </tr>

        <tr>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            <strong>Subject</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #dddddd;">
            ${subject}
          </td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 24px;">
      <h3
        style="
          font-size: 18px;
          margin-bottom: 12px;
          color: #222222;
        "
      >
        Message
      </h3>

      <div
        style="
          border: 1px solid #dddddd;
          padding: 16px;
          white-space: pre-wrap;
        "
      >
        ${message}
      </div>
    </div>

    <div
      style="
        margin-top: 32px;
        padding-top: 20px;
        border-top: 1px solid #e5e5e5;
        font-size: 14px;
      "
    >
      ${
        isAdmin
          ? `
            <p>
              This message was generated automatically from the website contact form.
            </p>
          `
          : `
            <p>
              This is an automated confirmation email. Please do not reply directly to this message.
            </p>
          `
      }

      <p>
        Kind regards,<br />
        Customer Support Team
      </p>
    </div>
  </div>
  `;
};

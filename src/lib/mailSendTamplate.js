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
      background:#f4f7fb;
      padding:40px 20px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    "
  >
    <div
      style="
        max-width:700px;
        margin:0 auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 4px 20px rgba(0,0,0,0.08);
      "
    >
      <!-- Header -->
      <div
        style="
          background:#2563eb;
          padding:40px 30px;
          text-align:center;
        "
      >
        <h1
          style="
            margin:0;
            color:#ffffff;
            font-size:28px;
            font-weight:700;
          "
        >
          ${requestType}
        </h1>

        <p
          style="
            margin:10px 0 0;
            color:#dbeafe;
            font-size:14px;
          "
        >
          ${
            isAdmin
              ? 'New request submitted from the website'
              : 'We have successfully received your request'
          }
        </p>
      </div>

      <!-- Content -->
      <div style="padding:40px 32px;">
        ${
          isAdmin
            ? `
              <p
                style="
                  margin-top:0;
                  color:#374151;
                  font-size:16px;
                "
              >
                A new ${requestType.toLowerCase()} has been submitted and requires review.
              </p>
            `
            : `
              <p
                style="
                  margin-top:0;
                  color:#111827;
                  font-size:16px;
                "
              >
                Dear <strong>${firstName} ${lastName}</strong>,
              </p>

              <p
                style="
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                Thank you for contacting us. We have successfully received your request.
                Our team is currently reviewing the information and will get back to you as soon as possible.
              </p>
            `
        }

        <!-- Request Information -->
        <div style="margin-top:32px;">
          <h2
            style="
              margin:0 0 16px;
              font-size:18px;
              color:#111827;
            "
          >
            Request Information
          </h2>

          <div
            style="
              background:#f9fafb;
              border:1px solid #e5e7eb;
              border-radius:12px;
              padding:24px;
            "
          >
            <div style="margin-bottom:12px;">
              <strong style="color:#111827;">First Name:</strong>
              <span style="color:#4b5563;"> ${firstName}</span>
            </div>

            <div style="margin-bottom:12px;">
              <strong style="color:#111827;">Last Name:</strong>
              <span style="color:#4b5563;"> ${lastName}</span>
            </div>

            <div style="margin-bottom:12px;">
              <strong style="color:#111827;">Email:</strong>
              <span style="color:#4b5563;"> ${email}</span>
            </div>

            <div style="margin-bottom:12px;">
              <strong style="color:#111827;">Request Type:</strong>
              <span style="color:#4b5563;"> ${requestType}</span>
            </div>

            <div>
              <strong style="color:#111827;">Subject:</strong>
              <span style="color:#4b5563;"> ${subject}</span>
            </div>
          </div>
        </div>

        <!-- Message -->
        <div style="margin-top:32px;">
          <h2
            style="
              margin:0 0 16px;
              font-size:18px;
              color:#111827;
            "
          >
            Message
          </h2>

          <div
            style="
              background:#eff6ff;
              border-left:4px solid #2563eb;
              border-radius:10px;
              padding:20px;
              color:#374151;
              white-space:pre-wrap;
              line-height:1.8;
            "
          >
            ${message}
          </div>
        </div>

        ${
          !isAdmin
            ? `
              <div
                style="
                  margin-top:32px;
                  padding:20px;
                  background:#f0fdf4;
                  border:1px solid #bbf7d0;
                  border-radius:10px;
                "
              >
                <p
                  style="
                    margin:0;
                    color:#166534;
                    font-size:14px;
                  "
                >
                  Our support team will review your request and respond shortly.
                </p>
              </div>
            `
            : ''
        }
      </div>

      <!-- Footer -->
      <div
        style="
          border-top:1px solid #e5e7eb;
          padding:24px;
          text-align:center;
          background:#fafafa;
        "
      >
        <p
          style="
            margin:12px 0 0;
            color:#9ca3af;
            font-size:12px;
          "
        >
          © ${new Date().getFullYear()} Customer Support Team. All rights reserved.
        </p>
      </div>
    </div>
  </div>
  `;
};

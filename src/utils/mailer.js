const nodemailer = require('nodemailer');

// Builds a transporter from environment variables. If not configured, returns null.
function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for others
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendMail({ to, subject, text, html }) {
  let transporter = buildTransporter();
  let usingTest = false;
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[mailer] SMTP not configured in production. Skipping email to', to);
      return { skipped: true };
    }
    // Create Ethereal test account for development preview
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    usingTest = true;
    console.log('[mailer] Using Ethereal test account for email preview.');
  }
  const from = process.env.MAIL_FROM || `MegaMart <no-reply@megamart.local>`;
  const info = await transporter.sendMail({ from, to, subject, text, html });
  if (usingTest) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[mailer] Preview URL:', url);
  }
  return info;
}

function formatLoginEmail({ name, email, when, ip, ua }) {
  const subject = `Successful verification — Welcome to MegaMart`;
  const greeting = `Hi ${name || 'there'},`;
  const intro = `Your login has been verified successfully. Welcome back to MegaMart!`;
  const meta = `Time: ${when}\nIP: ${ip}\nDevice: ${ua}`;
  const footer = `If this wasn't you, please reset your password immediately.`;

  const text = `${greeting}\n\n${intro}\n\n${meta}\n\n${footer}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 10px">Successful verification — Welcome to MegaMart</h2>
      <p>${greeting}</p>
      <p>${intro}</p>
      <ul>
        <li><strong>Time:</strong> ${when}</li>
        <li><strong>IP:</strong> ${ip}</li>
        <li><strong>Device:</strong> ${ua}</li>
      </ul>
      <p>${footer}</p>
      <p style="color:#666;font-size:12px;margin-top:16px">This is an automated message. Please do not reply.</p>
    </div>
  `;
  return { subject, text, html };
}

async function sendLoginEmail(user, meta = {}) {
  if (!user?.email) return;
  const when = new Date().toLocaleString();
  const payload = formatLoginEmail({
    name: user.name,
    email: user.email,
    when,
    ip: meta.ip || 'unknown',
    ua: meta.ua || 'unknown'
  });
  try {
    await sendMail({ to: user.email, ...payload });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send login email', err);
    return false;
  }
}

module.exports = { sendLoginEmail };
// OTP email helper
async function sendOtpEmail(user, otp) {
  if (!user?.email || !otp) return false;
  const subject = `Your MegaMart verification code: ${otp}`;
  const text = `Hi ${user.name || 'there'},\n\nYour one-time verification code is: ${otp}\nThis code will expire in 10 minutes.\n\nIf you did not attempt to log in, please ignore this email.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#111">
      <h2 style="margin:0 0 10px">Your MegaMart verification code</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:10px 0 6px">${otp}</div>
      <p style="margin:0 0 10px;color:#444">This code will expire in 10 minutes.</p>
      <p style="color:#666;font-size:12px">If you did not attempt to log in, you can safely ignore this email.</p>
    </div>
  `;
  try {
    await sendMail({ to: user.email, subject, text, html });
    return true;
  } catch (e) {
    console.error('[mailer] Failed to send OTP email', e);
    return false;
  }
}

module.exports.sendOtpEmail = sendOtpEmail;

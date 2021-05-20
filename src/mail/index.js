import nodemailer from "nodemailer";

let transporter;

(async function initEmail() {
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
})();

export async function sendEmail({
  from = '"Anton Zdanov" <azdanov@pm.me>',
  to,
  subject,
  text,
  html,
}) {
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log(info);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

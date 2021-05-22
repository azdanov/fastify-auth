import crypto from "node:crypto";
const { ROOT_DOMAIN, EMAIL_TOKEN_SECRET } = process.env;

export function createVerifyEmailToken(email) {
  const authString = `${email}.${EMAIL_TOKEN_SECRET}`;
  return crypto.createHash("sha256").update(authString).digest("hex");
}

export async function createVerifyEmailLink(email) {
  try {
    const emailToken = createVerifyEmailToken(email);
    const URIEncodedEmail = encodeURIComponent(email);

    return `https://${ROOT_DOMAIN}/verify/${URIEncodedEmail}/${emailToken}`;
  } catch (error) {
    console.log(error);
  }
}

export async function validateVerifyEmail(email, token) {
  try {
    const emailToken = createVerifyEmailToken(email);
    const isValid = emailToken === token;

    if (!isValid) {
      return false;
    }

    const { user } = await import("../models/user.js");
    await user.updateOne(
      { "email.address": email },
      { $set: { "email.verified": true } }
    );

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

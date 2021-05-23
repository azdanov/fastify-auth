import crypto from "node:crypto";
const { ROOT_DOMAIN, EMAIL_TOKEN_SECRET } = process.env;

function createResetToken(email, expTimestamp) {
  const authString = `${EMAIL_TOKEN_SECRET}:${email}:${expTimestamp}`;
  return crypto.createHash("sha256").update(authString).digest("hex");
}

export function createResetEmailLink(email) {
  const URIEncodedEmail = encodeURIComponent(email);
  const expTime = 24 * 60 * 60 * 1000; // One day in milliseconds
  const expTimestamp = Date.now() + expTime;
  const token = createResetToken(email, expTimestamp);

  return `https://${ROOT_DOMAIN}/reset/${URIEncodedEmail}/${expTimestamp}/${token}`;
}

export async function createResetLink(email) {
  try {
    const { user } = await import("../models/user.js");
    const foundUser = await user.findOne({ "email.address": email });

    if (!foundUser) {
      console.log(`User not found in createResetLink ${email}`);
      return;
    }

    return createResetEmailLink(email);
  } catch (error) {
    console.log(error);
  }
}

function validateExpTimestamp(expTimestamp) {
  const expTime = 24 * 60 * 60 * 1000; // One day in milliseconds
  const dateDiff = Number(expTimestamp) - Date.now();
  return dateDiff > 0 && dateDiff < expTime;
}

export async function validateResetEmail(token, email, expTimestamp) {
  try {
    const resetToken = createResetToken(email, expTimestamp);
    const isValid = resetToken === token;
    const isTimestampValid = validateExpTimestamp(expTimestamp);

    return isValid && isTimestampValid;
  } catch (error) {
    console.log(error);
    return false;
  }
}

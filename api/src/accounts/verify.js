import crypto from "node:crypto";
const { ROOT_DOMAIN } = process.env;

export async function createVerifyEmailLink() {
  const URIToken = crypto.randomUUID();

  return `https://${ROOT_DOMAIN}/verify/${URIToken}`;
}

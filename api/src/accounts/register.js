import bcrypt from "bcryptjs";

const { genSalt, hash } = bcrypt;

export async function registerUser({ email, password }) {
  const { user } = await import("../models/user.js");

  const salt = await genSalt(10);
  const hashedPassword = await hash(password, salt);

  const result = await user.insertOne({
    email: { address: email, verified: false },
    password: hashedPassword,
  });

  return result.insertedId;
}

export async function changePassword(userId, newPassword) {
  const { user } = await import("../models/user.js");

  const salt = await genSalt(10);
  const hashedPassword = await hash(newPassword, salt);

  return user.updateOne(
    { _id: userId },
    { $set: { password: hashedPassword } }
  );
}

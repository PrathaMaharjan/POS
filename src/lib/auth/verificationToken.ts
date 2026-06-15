// email verification token 
import crypto from "crypto";
import { hashToken } from "./hashtoken";

export const generateVerificationToken=()=>{
    const rawToken = crypto.randomBytes(30).toString("hex");
    return {
        rawToken,
        tokenHash : hashToken(rawToken)
    }
}

export function getVerificationExpiryDate() {
  // 24 hours
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}
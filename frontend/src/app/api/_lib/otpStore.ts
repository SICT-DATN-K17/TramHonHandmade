// This is a simple in-memory store for OTPs.
// In a real application, you would use a database like Redis.

type PendingUser = {
  name: string;
  email: string;
  password?: string;
};

const otpStore = new Map<string, { code: string; expires: number; userData?: PendingUser }>();
const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Stores an OTP for a given email.
 * @param email The user's email.
 * @param code The OTP code.
 * @param userData The pending user's data to be stored (optional).
 */
export function storeOtp(email: string, code: string, userData?: PendingUser) {
  const expires = Date.now() + OTP_EXPIRATION_TIME;
  otpStore.set(email, { code, expires, userData });
}

/**
 * Verifies if the provided OTP is valid for the given email.
 * @param email The user's email.
 * @param code The OTP code to verify.
 * @returns True if the OTP is valid, false otherwise.
 */
export function verifyOtp(email: string, code: string): boolean {
  const entry = otpStore.get(email);
  if (!entry) return false;

  if (Date.now() > entry.expires) {
    otpStore.delete(email); // Clean up expired OTP
    return false;
  }

  return entry.code === code;
}

/**
 * Retrieves the user data associated with a valid OTP entry.
 * @param email The user's email.
 * @returns The stored user data, or null if not found.
 */
export function getVerifiedUserData(email: string): PendingUser | null {
  const entry = otpStore.get(email);
  return entry?.userData ?? null;
}

/**
 * Clears the OTP for a given email after it has been successfully used.
 * @param email The user's email.
 */
export function clearOtp(email: string) {
  otpStore.delete(email);
}
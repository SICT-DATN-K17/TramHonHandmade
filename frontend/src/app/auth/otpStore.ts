interface OtpEntry {
  code: string;
  expiresAt: number;
}

// Giả lập lưu trữ OTP trong bộ nhớ.
// Trong ứng dụng thực tế, bạn nên dùng Redis hoặc Database.
const otpStore = new Map<string, OtpEntry>();

const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 phút

export function storeOtp(email: string, code: string) {
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  otpStore.set(email, { code, expiresAt });
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = otpStore.get(email);
  if (!entry || entry.expiresAt < Date.now() || entry.code !== code) {
    return false;
  }
  // Xóa mã OTP sau khi đã xác thực thành công
  otpStore.delete(email);
  return true;
}
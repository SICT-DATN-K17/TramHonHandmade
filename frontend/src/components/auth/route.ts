import { NextResponse } from 'next/server';
import { db } from '@/app/api/_lib/mockData';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { storeOtp } from '@/app/api/_lib/otpStore';
import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: 'Vui lòng nhập email' }, { status: 400 });
    }

    // Kiểm tra xem email có tồn tại trong hệ thống không
    const userExists = db.users.some((user) => user.email === email);
    if (!userExists) {
      return NextResponse.json({ message: 'Email không tồn tại trong hệ thống.' }, { status: 404 });
    }

    // Tạo mã OTP và gửi email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    storeOtp(email, otp);

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
			console.error('Lỗi nghiêm trọng: RESEND_API_KEY không được thiết lập trong file .env.local hoặc next.config.mjs');
			return NextResponse.json({ message: 'Lỗi cấu hình server, không thể gửi email.' }, { status: 500 });
		}
    const resend = new Resend(apiKey);

    const emailHtml = await render(ResetPasswordEmail({ email, otp }));

    await resend.emails.send({
      from: 'TramHon <onboarding@resend.dev>',
      to: [email],
      subject: 'Mã đặt lại mật khẩu TramHon của bạn',
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Mã xác nhận đã được gửi đến email của bạn.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password API error:', error);
    return NextResponse.json({ message: 'Lỗi không xác định từ server' }, { status: 500 });
  }
}

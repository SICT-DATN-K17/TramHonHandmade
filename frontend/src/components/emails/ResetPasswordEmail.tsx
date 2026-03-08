import React from 'react';

interface ResetPasswordEmailProps {
  email: string;
  otp: string;
}

export function ResetPasswordEmail({ email, otp }: ResetPasswordEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
      <h1 style={{ color: '#3F2E23' }}>Yêu cầu đặt lại mật khẩu Trạm Hồn</h1>
      <p>Chào bạn,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email: <strong>{email}</strong>.</p>
      <p>Vui lòng sử dụng mã xác thực dưới đây để hoàn tất quá trình:</p>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '20px 0',
        padding: '10px',
        backgroundColor: '#FFF8F0',
        border: '1px solid #E8D5B5',
        borderRadius: '8px',
        textAlign: 'center',
        letterSpacing: '0.5em',
      }}>
        {otp}
      </div>
      <p>Mã này sẽ hết hạn sau 10 phút.</p>
      <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
      <hr style={{ borderColor: '#E8D5B5', margin: '20px 0' }} />
      <p style={{ fontSize: '12px', color: '#999' }}>Trân trọng,<br />Đội ngũ Trạm Hồn</p>
    </div>
  );
}
import React from 'react';

interface VerificationEmailProps {
  username: string;
  otp: string;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({
  username,
  otp,
}) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px', color: '#333' }}>
    <h1 style={{ color: '#3F2E23' }}>Chào mừng bạn đến với Trạm Hồn!</h1>
    <p>Chào {username},</p>
    <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất quá trình đăng ký:</p>
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
    <p>Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email này.</p>
    <hr style={{ borderColor: '#E8D5B5', margin: '20px 0' }} />
    <p style={{ fontSize: '12px', color: '#999' }}>
      Trân trọng,<br />
      Đội ngũ Trạm Hồn
    </p>
  </div>
);
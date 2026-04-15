import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, message: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://jyastibuildstrust.com/assets/jyastiLogo.png" alt="JYASTI" style="height: 60px;">
          </div>
          <h2 style="color: #0f766e; text-align: center; margin-bottom: 30px;">Email Verification</h2>
          <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">Your verification code is:</p>
            <h1 style="font-size: 36px; color: #0d9488; letter-spacing: 5px; margin: 0;">${message}</h1>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">This code will expire in 5 minutes.</p>
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>If you did not request this code, please ignore this email.</p>
            <p>© 2026 JYASTI builds trust. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendStaffWelcomeEmail = async (to: string, staffName: string) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Welcome to JYASTI Admin Panel - Staff Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://jyastibuildstrust.com/assets/jyastiLogo.png" alt="JYASTI" style="height: 60px;">
          </div>
          <h2 style="color: #0d9488; text-align: center; margin-bottom: 30px;">Welcome, ${staffName}!</h2>
          <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 20px; border-radius: 8px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Your staff account has been created successfully. You can now log in to the admin panel using Secure OTP Verification:</p>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #ccfbf1; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Registered Email</p>
                <p style="margin: 5px 0 20px 0; color: #111827; font-weight: bold; font-size: 18px;">${to}</p>
                <div style="background-color: #0d9488; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">
                  LOGIN WITH MOBILE + OTP
                </div>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">To access your dashboard, use your registered mobile number on the admin login page. You will receive a secure OTP to verify your identity.</p>
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>If you have any questions, please contact your administrator.</p>
            <p>© 2026 JYASTI builds trust. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Staff welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending staff welcome email:', error);
    return false;
  }
};

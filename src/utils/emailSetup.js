const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPVerificationEmail = async (email, otp) => {
    const mailOptions = {
        from: `"CollabDocs" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email to Join CollabDocs',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0F172A; padding: 20px; border-radius: 10px; color: #F8FAFC;">
                <h2 style="color: #4F46E5; text-align: center; margin-bottom: 20px;">Welcome to CollabDocs!</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #E2E8F0;">
                    Hello,<br><br>
                    You are just one step away from joining. Please use the following 6-digit One Time Password (OTP) to verify your email address.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 15px 25px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 14px; color: #94A3B8; text-align: center;">
                    This code is valid for <strong>10 minutes</strong>.<br>
                    If you did not request this, please ignore this email.
                </p>
                <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;">
                <p style="font-size: 12px; color: #64748B; text-align: center;">
                    &copy; ${new Date().getFullYear()} CollabDocs. All rights reserved.
                </p>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPVerificationEmail };

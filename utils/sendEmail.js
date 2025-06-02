const nodeMailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const sendEmail = async ({ email, subject, message }) => {
    try {
        const transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            service: process.env.SMTP_SERVICE,
            port: Number(process.env.PORTS),
            secure: false, // true for port 465, false for 587
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            // tls: {
            //     rejectUnauthorized: false, // for development; remove in production
            // },
        });

        const options = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: subject,
            html: message,
        };

        await transporter.sendMail(options);
        console.log("✅ Email sent successfully to:", email);
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error("Failed to send email");
    }
};

module.exports = { sendEmail };

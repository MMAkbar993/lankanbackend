const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendContactMessage = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            subject,
            message,
            agreedToContact,
        } = req.body;

        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            });
        }

        const emailContent = `
NEW CONTACT FORM MESSAGE
========================

Full Name: ${fullName}
Email Address: ${email}
Phone Number: ${phone || "Not provided"}
Subject: ${subject}

Message:
${message}

Contact Permission:
${agreedToContact ? "Yes" : "No"}
        `.trim();

        const mailInfo = await transporter.sendMail({
            from: `"Lankan Ads" <${process.env.SMTP_USER}>`,

            to:
                process.env.CONTACT_RECEIVER_EMAIL ||
                process.env.EMAIL_USER,

            replyTo: email,

            subject: `Contact Form: ${subject}`,

            text: emailContent,
        });

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: {
                messageId: mailInfo.messageId,
            },
        });
    } catch (error) {
        console.error("Contact email error:", error);

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to send message",
        });
    }
};

module.exports = {
    sendContactMessage,
};
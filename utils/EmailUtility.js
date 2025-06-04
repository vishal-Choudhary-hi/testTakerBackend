const nodemailer = require("nodemailer");
const { emailLog } = require("../utils/LogUtility")
const pug = require("pug");
const fs = require("fs");
const path = require("path");

const sendMail = async (toEmail, emailType, additionalData = null) => {
    let emailStatus = true;
    let failureReason = 'NA';
    let subject = '';
    let content = '';
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAILHOST,
            port: process.env.EMAILPORT,
            secure: false,
            auth: {
                user: process.env.EMAILDOMAIN,
                pass: process.env.EMAILPASSWORD
            }
        });
        subject = getEmailSubject(emailType, additionalData);
        content = getEmailContent(emailType, additionalData);
        const mailOptions = {
            from: process.env.FROMEMAIL,
            to: toEmail,
            subject: subject,
            html: content
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        emailStatus = false;
        failureReason = error.message
        console.error(error);
    }
    await emailLog(emailType, content, emailStatus, new Date(), failureReason)
    return emailStatus;
}

const getEmailSubject = (emailType, additionalData = null) => {
    let subject = null;
    switch (emailType) {
        case 'UserOTP':
            subject = `TestEra: User ${additionalData.alreadyRegisteredUser ? "Login" : "Registration"} OTP 🔒`;
            break;
        case "testInviteEmail":
            subject = `TestEra: 📩 Invitation to attend ${additionalData.testName}`;
            break;
        case "testResultEmail":
            subject = `TestEra: 🏆 Your Test Result for ${additionalData.testName}`;
        default:
            break;
    }
    return subject
}
const getEmailContent = (emailType, additionalData = null) => {
    let compiledHTML = null;
    let emailTemplateFileName = null;
    switch (emailType) {
        case 'UserOTP':
            if (additionalData.alreadyRegisteredUser === true) {
                emailTemplateFileName = "sendUserOTPEmailLogin.pug";
            } else {
                emailTemplateFileName = "sendUserOTPEmailRegister.pug";
            }
            break;
        case "testInviteEmail":
            emailTemplateFileName = "testInviteEmail.pug"
            break;
        case "testResultEmail":
            emailTemplateFileName = "testResultEmail.pug"
            break;
        default:
            break;
    }
    const templatePath = path.join(__dirname, "../public/emailTemplates", emailTemplateFileName);
    compiledHTML = pug.renderFile(templatePath, additionalData);
    return compiledHTML;
}
module.exports = { sendMail }
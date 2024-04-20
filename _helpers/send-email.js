const nodemailer = require('nodemailer');
const config = require('config.json');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom, attachments = null }) {
    console.log(`Sending email to ${to} related to sub ${subject}`);
    const transporter = nodemailer.createTransport(config.smtpOptions);
    await transporter.sendMail({ from, to, subject, html, attachments });
}
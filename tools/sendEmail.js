const nodemailer = require("nodemailer");

const sendEmail = async (opt = { email, subject, html, message }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", //process.env.EMAIL_HOST
        auth: {
            user: "megotechno@gmail.com",//process.env.EMAIL_USERNAME
            pass: "jfzalkrrllnzxhdh",// process.env.EMAIL_PASSWORD
        },
    });

    //as HTML
    const mailerOptions = {
        from: "mrelbeltagy",
        to: opt.email,
        subject: opt.subject,
        html: opt.html,
        // message: opt.message
    };
    await transporter.sendMail(mailerOptions);
};

module.exports = sendEmail;
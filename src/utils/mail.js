import Mailgen from "mailgen";
import { ApiError } from "../utils/api-error.js";
import { Resend } from "resend";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://example.app",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const mail = {
    from: "Flowbase <team@mayurbadgujar.me>",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await resend.emails.send(mail);
  } catch (error) {
    throw new ApiError(400, "Failed to send email");
  }
};

const emailVerificationMailgenContent = (
  username,
  verificationUrl,
  urlExpiry,
) => {
  return {
    body: {
      name: username,
      intro: "Welcome to our app! We're very excited to have you on board.",
      action: {
        instructions:
          "To verify your email please click on the following button:",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
const forgotPasswordRequestMailgenContent = (
  username,
  resetPasswordUrl,
  urlExpiry,
) => {
  return {
    body: {
      name: username,
      intro: "We received a request to reset your password.",
      action: {
        instructions: "To reset your password, please click the button below:",
        button: {
          color: "#DC4D2F",
          text: "Reset your password",
          link: resetPasswordUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  sendEmail,
  forgotPasswordRequestMailgenContent,
};

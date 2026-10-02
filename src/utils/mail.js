import Mailgen from "mailgen";
import { Resend } from "resend";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Xugi",
      link: "https://xugi.in",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const mail = {
    from: "Xugi <team@mayurbadgujar.me>",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await resend.emails.send(mail);
  } catch (error) {
    console.error("Resend email error:", error?.message || error);
    throw new Error(`Failed to send email: ${error?.message}`);
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
      intro: "Welcome to Xugi! We're very excited to have you on board.",
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

const ghostInvitationMailgenContent = (
  inviteeName,
  inviterName,
  instituteName,
  projectName,
  onboardingUrl
) => {
  return {
    body: {
      name: inviteeName,
      intro: `${inviterName} from **${instituteName}** has invited you to collaborate on the project **${projectName}** on Xugi.`,
      action: {
        instructions: "To access your workspace and project files, activate your account below:",
        button: {
          color: "#0F172A",
          text: "Activate My Account",
          link: onboardingUrl,
        },
      },
      outro: "Need help? Reply to this email, we'd love to help.",
    },
  };
};

const mentorAssignedMailgenContent = (
  mentorName,
  projectName,
  groupNumber,
  dashboardUrl
) => {
  const groupText = groupNumber ? ` (Group ${groupNumber})` : "";
  return {
    body: {
      name: mentorName,
      intro: [
        `You have been assigned as the project mentor for **${projectName}**${groupText} on Xugi.`,
        "You can track task milestones, review member submissions, and monitor project attendance directly from your dashboard.",
      ],
      action: {
        instructions: "To view and manage this project, click the button below:",
        button: {
          color: "#4F46E5",
          text: "View Project Dashboard",
          link: dashboardUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

const leaderProjectCreatedMailgenContent = (
  leaderName,
  projectName,
  membersList,
  dashboardUrl
) => {
  const tableData = (membersList || []).map((m) => ({
    "Team Member": m.name || "Member",
    "Email": m.email,
    "Status": m.isRegistered ? "Ready / Active" : "Pending Registration",
  }));

  const bodyContent = {
    name: leaderName,
    intro: [
      `Your project **${projectName}** has been successfully created on Xugi!`,
      ...(tableData.length > 0
        ? ["Here is the current registration status of your project team members:"]
        : []),
    ],
    action: {
      instructions:
        tableData.length > 0
          ? 'IMPORTANT: Members listed with "Pending Registration" will not see the project until they log in. Please instruct them to visit https://xugi.in and sign in with their Google account using their registered email. Their project access will activate automatically upon signing in.'
          : "You can start organizing tasks, creating milestones, and collaborating on your project dashboard right away.",
      button: {
        color: "#4F46E5",
        text: "Open Live Dashboard",
        link: dashboardUrl,
      },
    },
    outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
  };

  if (tableData.length > 0) {
    bodyContent.table = {
      data: tableData,
    };
  }

  return { body: bodyContent };
};

const hodWorkspaceInvitationMailgenContent = (
  hodName,
  instituteName,
  onboardingUrl
) => {
  return {
    body: {
      name: hodName || "Head of Department",
      intro: [
        `Welcome to Xugi! You have been designated as the Head of Department (HOD) for **${instituteName}**.`,
        "Your institutional workspace license is active. You can now set up student batches, assign batch coordinators, and monitor capstone projects.",
      ],
      action: {
        instructions: "To activate your HOD account and access your workspace, please click below to sign in:",
        button: {
          color: "#4F46E5",
          text: "Access Institute Workspace",
          link: onboardingUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  sendEmail,
  forgotPasswordRequestMailgenContent,
  ghostInvitationMailgenContent,
  mentorAssignedMailgenContent,
  leaderProjectCreatedMailgenContent,
  hodWorkspaceInvitationMailgenContent,
};

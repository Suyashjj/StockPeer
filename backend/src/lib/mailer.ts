import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter =
    env.SMTP_USER && env.SMTP_PASS
        ? nodemailer.createTransport({
            service: "gmail",
            auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        })
        : null;

export async function sendMail(to: string, subject: string, html: string, text: string) {
    if (!transporter) {
        // No email set up: print it, so you can still test locally
        console.warn("[mailer] SMTP not configured. Email not sent.");
        console.warn(`[mailer] To: ${to}\n${text}`);
        return;
    }
    await transporter.sendMail({
        from: `"StockPeer" <${env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
    });
}
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER) {
    console.log('[Email] SMTP not configured, skipping:', subject)
    return false
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('[Email] Failed to send:', err)
    return false
  }
}

export function taskReminderEmail(taskTitle: string, dueDate: string, userName: string): SendEmailOptions & { subject: string; html: string } {
  return {
    to: '',
    subject: `Task Reminder: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">Task Reminder</h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder that your task <strong>${taskTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
        <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; color: #5b21b6;"><strong>${taskTitle}</strong></p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Due: ${dueDate}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Open AbhiBase to mark it complete or update the due date.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">AbhiBase - Your life, one base</p>
      </div>
    `,
  }
}

export function habitReminderEmail(habitName: string, habitIcon: string, userName: string): SendEmailOptions & { subject: string; html: string } {
  return {
    to: '',
    subject: `Habit Check-in: ${habitName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">Habit Reminder</h2>
        <p>Hi ${userName},</p>
        <p>Don't forget to check in for your habit <strong>${habitIcon} ${habitName}</strong> today!</p>
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; color: #15803d;"><strong>${habitIcon} ${habitName}</strong></p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Keep your streak going!</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Open AbhiBase to log today's progress.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">AbhiBase - Your life, one base</p>
      </div>
    `,
  }
}

export function eventReminderEmail(eventTitle: string, eventDate: string, startTime: string | null, userName: string): SendEmailOptions & { subject: string; html: string } {
  const timeStr = startTime ? ` at ${startTime}` : ''
  return {
    to: '',
    subject: `Upcoming Event: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">Event Reminder</h2>
        <p>Hi ${userName},</p>
        <p>You have an upcoming event <strong>${eventTitle}</strong> on <strong>${eventDate}${timeStr}</strong>.</p>
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; color: #1d4ed8;"><strong>${eventTitle}</strong></p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">${eventDate}${timeStr}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Open AbhiBase to view details.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">AbhiBase - Your life, one base</p>
      </div>
    `,
  }
}

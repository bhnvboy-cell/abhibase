'use client';

import nodemailer from 'nodemailer';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const DEFAULT_SMTP_CONFIG: SMTPConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport(DEFAULT_SMTP_CONFIG);
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || DEFAULT_SMTP_CONFIG.auth.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function getEmailTemplate(type: string, data: Record<string, any>): string {
  const templates: Record<string, string> = {
    welcome: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#6366f1">Welcome to AbhiBase!</h1>
        <p>Hi ${data.name || 'User'},</p>
        <p>Welcome to AbhiBase, your personal productivity platform.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>Manage your tasks and projects</li>
          <li>Track your habits and goals</li>
          <li>Take notes and organize your thoughts</li>
          <li>Use AI to boost your productivity</li>
        </ul>
        <a href="${data.baseUrl || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:20px">Get Started</a>
        <p style="color:#666;font-size:12px;margin-top:40px">If you have any questions, reply to this email.</p>
      </div>
    `,
    passwordReset: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#6366f1">Password Reset Request</h1>
        <p>Hi ${data.name || 'User'},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${data.resetUrl || '#'}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:20px">Reset Password</a>
        <p style="color:#666;font-size:12px;margin-top:40px">If you didn't request this, please ignore this email.</p>
      </div>
    `,
    taskAssigned: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#6366f1">New Task Assigned</h1>
        <p>Hi ${data.assigneeName || 'User'},</p>
        <p>You've been assigned a new task:</p>
        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:20px 0">
          <h3 style="margin:0 0 10px">${data.taskTitle || 'Task'}</h3>
          <p style="margin:0;color:#666">${data.taskDescription || ''}</p>
        </div>
        <a href="${data.taskUrl || '#'}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">View Task</a>
      </div>
    `,
    weeklyReport: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h1 style="color:#6366f1">Your Weekly Report</h1>
        <p>Hi ${data.name || 'User'},</p>
        <p>Here's your productivity summary for this week:</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin:20px 0">
          <div style="background:#f8f9fa;padding:15px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#6366f1">${data.tasksCompleted || 0}</div>
            <div style="color:#666">Tasks Completed</div>
          </div>
          <div style="background:#f8f9fa;padding:15px;border-radius:8px;text-align:center">
            <div style="font-size:24px;font-weight:bold;color:#10b981">${data.habitsStreak || 0}</div>
            <div style="color:#666">Day Streak</div>
          </div>
        </div>
        <a href="${data.baseUrl || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px">View Dashboard</a>
      </div>
    `,
  };
  
  return templates[type] || templates.welcome;
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to AbhiBase!',
    html: getEmailTemplate('welcome', { name }),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: getEmailTemplate('passwordReset', { name, resetUrl }),
  });
}

export async function sendTaskAssignedEmail(
  email: string,
  assigneeName: string,
  taskTitle: string,
  taskDescription: string,
  taskUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `New Task Assigned: ${taskTitle}`,
    html: getEmailTemplate('taskAssigned', { assigneeName, taskTitle, taskDescription, taskUrl }),
  });
}

export async function sendWeeklyReportEmail(email: string, name: string, stats: {
  tasksCompleted: number;
  habitsStreak: number;
}): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Your Weekly Productivity Report',
    html: getEmailTemplate('weeklyReport', { name, ...stats }),
  });
}

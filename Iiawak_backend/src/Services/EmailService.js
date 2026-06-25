'use strict';
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('../Logger/logger');

/**
 * EmailService — Gửi email thông báo
 * Hỗ trợ: Gmail, SendGrid, SMTP tùy chỉnh
 */
class EmailService {
  constructor() {
    this.transporter = this.initializeTransporter();
    this.templates = this.loadTemplates();
  }

  /**
   * Khởi tạo transporter email
   */
  initializeTransporter() {
    const provider = process.env.EMAIL_PROVIDER || 'gmail';

    try {
      if (provider === 'sendgrid') {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        return sgMail;
      }

      // Default: Nodemailer with Gmail or SMTP
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD,
        },
      };

      return nodemailer.createTransport(config);
    } catch (err) {
      logger.error('Email transporter initialization failed', { error: err.message });
      return null;
    }
  }

  /**
   * Load email templates từ thư mục templates/emails/
   */
  loadTemplates() {
    const templates = {};
    const templatesDir = path.join(__dirname, '../../templates/emails');

    if (!fs.existsSync(templatesDir)) {
      logger.warn('Email templates directory not found', { path: templatesDir });
      return templates;
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));

    files.forEach(file => {
      const name = file.replace('.html', '');
      const filePath = path.join(templatesDir, file);
      templates[name] = fs.readFileSync(filePath, 'utf-8');
    });

    logger.info('Email templates loaded', { count: files.length, templates: Object.keys(templates) });
    return templates;
  }

  /**
   * Render email template với variables
   */
  renderTemplate(templateName, variables = {}) {
    let html = this.templates[templateName];
    if (!html) {
      logger.warn('Email template not found', { template: templateName });
      return '';
    }

    // Replace {{variable}} with value
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });

    return html;
  }

  /**
   * Gửi email password reset
   */
  async sendPasswordResetEmail(email, resetToken, userName = '') {
    const resetUrl = `${process.env.ADMIN_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = this.renderTemplate('password-reset', {
      userName: userName || email,
      resetUrl,
      expiresIn: '30 minutes',
    });

    return this.send({
      to: email,
      subject: 'Đặt lại mật khẩu Iiawak',
      html,
    });
  }

  /**
   * Gửi email xác nhận thanh toán
   */
  async sendPaymentConfirmationEmail(email, paymentData) {
    const html = this.renderTemplate('payment-confirmation', {
      userName: paymentData.userName || 'Người dùng',
      transactionId: paymentData.txId,
      amount: paymentData.amountKch,
      bonus: paymentData.bonus || 0,
      date: new Date().toLocaleDateString('vi-VN'),
      status: paymentData.status === 'success' ? 'Thành công' : 'Đang xử lý',
    });

    return this.send({
      to: email,
      subject: `Xác nhận thanh toán - ${paymentData.amountKch} KCH`,
      html,
    });
  }

  /**
   * Gửi email thông báo sự kiện
   */
  async sendEventNotificationEmail(email, eventData) {
    const html = this.renderTemplate('event-notification', {
      userName: eventData.userName || 'Người dùng',
      eventTitle: eventData.title,
      eventDescription: eventData.description,
      eventDate: eventData.date,
      actionUrl: eventData.actionUrl || '#',
      actionText: eventData.actionText || 'Xem chi tiết',
    });

    return this.send({
      to: email,
      subject: `Thông báo: ${eventData.title}`,
      html,
    });
  }

  /**
   * Gửi email chào mừng
   */
  async sendWelcomeEmail(email, userName) {
    const html = this.renderTemplate('welcome', {
      userName,
      appName: 'Iiawak',
      loginUrl: `${process.env.ADMIN_URL || 'http://localhost:3000'}/login`,
    });

    return this.send({
      to: email,
      subject: 'Chào mừng bạn đến với Iiawak!',
      html,
    });
  }

  /**
   * Gửi email OTP xác thực
   */
  async sendOTPEmail(email, otp, expiresIn = 5) {
    const html = this.renderTemplate('otp-verification', {
      otp,
      expiresIn,
      appName: 'Iiawak',
    });

    return this.send({
      to: email,
      subject: `Mã xác thực Iiawak: ${otp}`,
      html,
    });
  }

  /**
   * Gửi email thường (generic)
   */
  async send(mailOptions) {
    if (!this.transporter) {
      logger.warn('Email transporter not initialized, email not sent', { to: mailOptions.to });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      // Set default from address
      mailOptions.from = process.env.EMAIL_FROM || 'noreply@iiawak.com';

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent',
      };
    } catch (err) {
      logger.error('Email send failed', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        error: err.message,
      });

      return {
        success: false,
        error: err.message,
        message: 'Email send failed',
      };
    }
  }

  /**
   * Gửi email hàng loạt (async, không chờ)
   */
  async sendBatch(emailList, template, variables = {}) {
    const results = [];

    for (const email of emailList) {
      const html = this.renderTemplate(template, { ...variables, email });
      const result = await this.send({
        to: email,
        subject: variables.subject || 'Thông báo từ Iiawak',
        html,
      });
      results.push({ email, ...result });

      // Rate limiting: 100ms between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info('Email batch sent', { total: emailList.length, successful: results.filter(r => r.success).length });
    return results;
  }

  /**
   * Test email connection
   */
  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      logger.info('Email connection test successful');
      return { success: true, message: 'Email service connected' };
    } catch (err) {
      logger.error('Email connection test failed', { error: err.message });
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();

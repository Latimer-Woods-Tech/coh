/**
 * Email utilities using Resend API
 * https://resend.com - Transactional email service
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via Resend API
 */
export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
}): EmailTemplate {
  return {
    subject: 'Reset your CypherOfHealing password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Password Reset</h1></div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>We received a request to reset your password. Click below to choose a new one. This link expires in 1 hour.</p>
      <a href="${params.resetUrl}" class="button">Reset Password</a>
      <p style="margin-top:24px; font-size:12px; color:#704214;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <div class="footer"><p>CypherOfHealing.com | The outer is a reflection of the inner</p></div>
  </div>
</body>
</html>`,
    text: `Reset your password: ${params.resetUrl}\n\nThis link expires in 1 hour.`,
  };
}

export async function sendEmail(
  apiKey: string,
  params: EmailParams
): Promise<{ id: string; from?: string } | null> {
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@cypherofhealing.com',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to send email:', error);
    return null;
  }
}

/**
 * Email template: Booking confirmation
 */
export function bookingConfirmationEmail(params: {
  userName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  depositAmount: string;
  cancelUrl: string;
}): EmailTemplate {
  return {
    subject: `Booking Confirmed: ${params.serviceName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
    .detail { margin: 10px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Booking Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      
      <div class="detail"><strong>Service:</strong> ${params.serviceName}</div>
      <div class="detail"><strong>Date:</strong> ${params.appointmentDate}</div>
      <div class="detail"><strong>Time:</strong> ${params.appointmentTime}</div>
      <div class="detail"><strong>Deposit Required:</strong> $${params.depositAmount}</div>
      
      <p>You will receive a reminder 24 hours before your appointment.</p>
      
      <p style="color: #704214; font-size: 12px;">
        <a href="${params.cancelUrl}" style="color: #704214; text-decoration: underline;">Need to reschedule or cancel?</a>
      </p>
    </div>
    <div class="footer">
      <p>CypherOfHealing.com | The outer is a reflection of the inner</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Booking Confirmed: ${params.serviceName}\n\nDate: ${params.appointmentDate}\nTime: ${params.appointmentTime}\nDeposit: $${params.depositAmount}`,
  };
}

/**
 * Email template: Order confirmation
 */
export function orderConfirmationEmail(params: {
  userName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  total: string;
  checkoutUrl?: string;
}): EmailTemplate {
  const itemsList = params.items
    .map((item) => `  • ${item.name} x${item.quantity} - $${item.price}`)
    .join('\n');

  return {
    subject: `Order Confirmation: #${params.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
    .item { border-bottom: 1px solid #2C1810; padding: 10px 0; }
    .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Order Confirmed</h1>
      <p>Order #${params.orderNumber}</p>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Thank you for your order! Here's what you purchased:</p>
      
      ${params.items
        .map(
          (item) =>
            `<div class="item">
        <div><strong>${item.name}</strong></div>
        <div class="detail">Qty: ${item.quantity} × $${item.price}</div>
      </div>`
        )
        .join('')}
      
      <div class="total">Total: $${params.total}</div>
      
      <p style="margin-top: 30px; font-size: 14px;">
        You will receive shipping/delivery information shortly.
      </p>
      
      ${
        params.checkoutUrl
          ? `<a href="${params.checkoutUrl}" class="button">Complete Payment</a>`
          : ''
      }
    </div>
    <div class="footer">
      <p>CypherOfHealing.com | Thank you for supporting this work</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Order Confirmation: #${params.orderNumber}\n\nItems:\n${itemsList}\n\nTotal: $${params.total}`,
  };
}

/**
 * Email template: Course enrollment confirmation
 */
export function enrollmentConfirmationEmail(params: {
  userName: string;
  courseTitle: string;
  courseUrl: string;
  firstLessonTitle: string;
}): EmailTemplate {
  return {
    subject: `Welcome to ${params.courseTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; text-align: center; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to the Academy</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Welcome to <strong>${params.courseTitle}</strong>. You're about to transform your relationship to trauma and healing.</p>
      
      <p style="margin-top: 30px;">Your first lesson is waiting:</p>
      <p style="font-size: 16px; font-weight: bold; color: #704214;">${params.firstLessonTitle}</p>
      
      <p style="margin-top: 30px; font-size: 14px;">
        Take your time. This is deep work. There's no rush. The material will be here when you're ready.
      </p>
      
      <a href="${params.courseUrl}" class="button">Start Learning</a>
      
      <p style="margin-top: 40px; font-size: 12px; color: #704214;">
        Questions? Reply to this email or visit our support center.
      </p>
    </div>
    <div class="footer">
      <p>CypherOfHealing.com | The outer is a reflection of the inner</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Welcome to ${params.courseTitle}\n\nYour first lesson: ${params.firstLessonTitle}\n\nView course: ${params.courseUrl}`,
  };
}

/**
 * Email template: Event registration confirmation
 */
export function eventRegistrationEmail(params: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventUrl: string;
  zoomLink?: string;
}): EmailTemplate {
  return {
    subject: `Event Registered: ${params.eventTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
    .detail { margin: 10px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Registered for Event</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>You're registered for:</p>
      
      <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <h2 style="margin: 0 0 15px 0; color: #704214;">${params.eventTitle}</h2>
        <div class="detail"><strong>Date:</strong> ${params.eventDate}</div>
        <div class="detail"><strong>Time:</strong> ${params.eventTime}</div>
        ${params.zoomLink ? `<div class="detail"><strong>Link:</strong> <a href="${params.zoomLink}">${params.zoomLink}</a></div>` : ''}
      </div>
      
      <p style="font-size: 14px;">A reminder will be sent 24 hours before the event starts.</p>
      
      <a href="${params.eventUrl}" class="button">View Event Details</a>
    </div>
    <div class="footer">
      <p>CypherOfHealing.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Registered: ${params.eventTitle}\n\nDate: ${params.eventDate}\nTime: ${params.eventTime}${params.zoomLink ? `\nJoin: ${params.zoomLink}` : ''}`,
  };
}

/**
 * Email template: Payment confirmation
 */
export function paymentConfirmationEmail(params: {
  userName: string;
  amount: string;
  purpose: string;
  transactionId: string;
  receiptUrl?: string;
}): EmailTemplate {
  return {
    subject: `Payment Received - $${params.amount}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2C1810; color: #F5ECD7; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #C9A84C; color: #2C1810; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Payment Received</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Thank you for your payment.</p>
      
      <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #C9A84C; margin-bottom: 10px;">$${params.amount}</div>
        <div style="font-size: 14px; color: #704214;">${params.purpose}</div>
        <div style="font-size: 12px; color: #999; margin-top: 10px;">Transaction ID: ${params.transactionId}</div>
      </div>
      
      <p style="font-size: 14px; text-align: center;">
        Your receipt has been sent to this email. Keep it for your records.
      </p>
      
      ${
        params.receiptUrl
          ? `<div style="text-align: center;"><a href="${params.receiptUrl}" class="button">View Receipt</a></div>`
          : ''
      }
    </div>
    <div class="footer">
      <p>CypherOfHealing.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Payment Received\n\nAmount: $${params.amount}\nFor: ${params.purpose}\nTransaction ID: ${params.transactionId}`,
  };
}

/**
 * Email template: Appointment reminder (24hrs before)
 */
export function appointmentReminderEmail(params: {
  userName: string;
  serviceName: string;
  appointmentTime: string;
  appointmentDate: string;
  practitionerName?: string;
  location?: string;
  rescheduleUrl: string;
}): EmailTemplate {
  return {
    subject: `Reminder: Your ${params.serviceName} appointment tomorrow`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #2C1810; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #C9A84C; color: #2C1810; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #E8DCBE; padding: 30px; }
    .footer { background: #2C1810; color: #C9A84C; padding: 20px; text-align: center; font-size: 12px; }
    .button { background: #704214; color: #F5ECD7; padding: 12px 24px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Appointment Reminder</h1>
    </div>
    <div class="content">
      <p>Hi ${params.userName},</p>
      <p>Just a friendly reminder about your upcoming appointment:</p>
      
      <div style="background: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 16px;">${params.serviceName}</p>
        <p style="margin: 5px 0;"><strong>Tomorrow at:</strong> ${params.appointmentTime}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${params.appointmentDate}</p>
        ${params.practitionerName ? `<p style="margin: 5px 0;"><strong>Practitioner:</strong> ${params.practitionerName}</p>` : ''}
        ${params.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${params.location}</p>` : ''}
      </div>
      
      <p style="font-size: 14px;">If you need to reschedule or cancel, let us know as soon as possible.</p>
      
      <a href="${params.rescheduleUrl}" class="button">Reschedule or Cancel</a>
    </div>
    <div class="footer">
      <p>CypherOfHealing.com</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Appointment Reminder\n\n${params.serviceName}\nTomorrow at ${params.appointmentTime}\n\nReschedule: ${params.rescheduleUrl}`,
  };
}

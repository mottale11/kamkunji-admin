import { supabase } from './supabase';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailData {
  to: string;
  toName: string;
  template: EmailTemplate;
  variables?: Record<string, string>;
}

export class EmailService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  // Send approval email to seller
  async sendApprovalEmail(sellerEmail: string, sellerName: string, itemTitle: string, adminNotes?: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: '🎉 Your Item Has Been Approved!',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Item Approved!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Great news from Kamkunji Ndogo</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${sellerName},</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Congratulations! Your item <strong>"${itemTitle}"</strong> has been approved and is now live on our marketplace.
            </p>
            
            <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #28a745; margin-top: 0;">✅ Approval Details</h3>
              <p style="margin: 5px 0; color: #555;">
                <strong>Item:</strong> ${itemTitle}<br>
                <strong>Status:</strong> Approved<br>
                <strong>Approved On:</strong> ${new Date().toLocaleDateString()}<br>
                ${adminNotes ? `<strong>Admin Notes:</strong> ${adminNotes}` : ''}
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Your item is now visible to all customers and can be purchased. You'll receive notifications when someone shows interest or makes a purchase.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Your Item
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              Thank you for choosing Kamkunji Ndogo!<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail({
      to: sellerEmail,
      toName: sellerName,
      template,
      variables: {
        itemTitle,
        adminNotes: adminNotes || 'No additional notes',
        approvalDate: new Date().toLocaleDateString()
      }
    });
  }

  // Send rejection email to seller
  async sendRejectionEmail(sellerEmail: string, sellerName: string, itemTitle: string, adminNotes: string): Promise<boolean> {
    const template: EmailTemplate = {
      subject: '📝 Item Review Update - Action Required',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">📝 Item Review Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Important information about your submission</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${sellerName},</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              We've reviewed your item <strong>"${itemTitle}"</strong> and unfortunately, it doesn't meet our current marketplace requirements.
            </p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #856404; margin-top: 0;">📋 Review Details</h3>
              <p style="margin: 5px 0; color: #856404;">
                <strong>Item:</strong> ${itemTitle}<br>
                <strong>Status:</strong> Not Approved<br>
                <strong>Reviewed On:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>Admin Notes:</strong> ${adminNotes}
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Don't worry! This is common and we're here to help. You can:
            </p>
            
            <ul style="color: #555; line-height: 1.6;">
              <li>Review the feedback and make necessary adjustments</li>
              <li>Resubmit your item with improvements</li>
              <li>Contact our support team for guidance</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/sell" style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Submit New Item
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              We appreciate your understanding and look forward to your future submissions!<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail({
      to: sellerEmail,
      toName: sellerName,
      template,
      variables: {
        itemTitle,
        adminNotes,
        reviewDate: new Date().toLocaleDateString()
      }
    });
  }

  // Send order status update email
  async sendOrderStatusEmail(customerEmail: string, customerName: string, orderNumber: string, status: string, trackingInfo?: string): Promise<boolean> {
    const statusEmojis: Record<string, string> = {
      'processing': '⚙️',
      'shipped': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };

    const statusMessages: Record<string, string> = {
      'processing': 'Your order is being prepared for shipment',
      'shipped': 'Your order has been shipped and is on its way',
      'delivered': 'Your order has been delivered successfully',
      'cancelled': 'Your order has been cancelled'
    };

    const template: EmailTemplate = {
      subject: `${statusEmojis[status] || '📦'} Order ${orderNumber} - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">${statusEmojis[status] || '📦'} Order Update</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order #${orderNumber}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${customerName},</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              ${statusMessages[status] || 'Your order status has been updated'}.
            </p>
            
            <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #28a745; margin-top: 0;">📋 Order Details</h3>
              <p style="margin: 5px 0; color: #555;">
                <strong>Order Number:</strong> ${orderNumber}<br>
                <strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}<br>
                <strong>Updated On:</strong> ${new Date().toLocaleDateString()}<br>
                ${trackingInfo ? `<strong>Tracking Info:</strong> ${trackingInfo}` : ''}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/orders/${orderNumber}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Order Details
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              Thank you for shopping with Kamkunji Ndogo!<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    return this.sendEmail({
      to: customerEmail,
      toName: customerName,
      template,
      variables: {
        orderNumber,
        status,
        trackingInfo: trackingInfo || 'Not available',
        updateDate: new Date().toLocaleDateString()
      }
    });
  }

  // Generic email sending method
  private async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Use a service like SendGrid, Mailgun, or AWS SES
      // 2. Or use Supabase Edge Functions for email sending
      // 3. Or integrate with your backend email service
      
      // For now, we'll simulate email sending
      console.log('📧 Email would be sent:', {
        to: emailData.to,
        subject: emailData.template.subject,
        body: emailData.template.body
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log to admin activity (in production, this would be a real email)
      await this.logEmailActivity(emailData);

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Log email activity for admin tracking
  private async logEmailActivity(emailData: EmailData): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_activity_log')
        .insert([{
          action: 'email_sent',
          table_name: 'email_logs',
          record_id: crypto.randomUUID(),
          details: {
            to: emailData.to,
            toName: emailData.toName,
            subject: emailData.template.subject,
            sentAt: new Date().toISOString()
          }
        }]);

      if (error) {
        console.error('Failed to log email activity:', error);
      }
    } catch (error) {
      console.error('Error logging email activity:', error);
    }
  }

  // Get email templates
  getEmailTemplates() {
    return {
      approval: {
        subject: '🎉 Your Item Has Been Approved!',
        body: 'Congratulations! Your item has been approved and is now live on our marketplace.'
      },
      rejection: {
        subject: '📝 Item Review Update - Action Required',
        body: 'We\'ve reviewed your item and it doesn\'t meet our current marketplace requirements.'
      },
      orderUpdate: {
        subject: '📦 Order Status Update',
        body: 'Your order status has been updated.'
      }
    };
  }
}

// Create default instance
export const emailService = new EmailService();

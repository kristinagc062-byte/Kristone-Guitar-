import type { Order } from '@/lib/order';
import { escapeHtml } from '@/lib/order';
import { formatNpr } from '@/lib/product';

const row=(label:string,value:string|number)=>`<tr><td style="padding:8px 0;color:#8c8275;font-size:13px">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;color:#17130e;font-size:13px;font-weight:700">${escapeHtml(value)}</td></tr>`;
const shell=(brand:string,preheader:string,content:string)=>`<!doctype html><html><body style="margin:0;background:#eee9df;font-family:Arial,sans-serif;color:#17130e"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eee9df"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#11100e;padding:28px;text-align:center;color:#caa052;font-family:Georgia,serif;font-size:23px;letter-spacing:3px">${escapeHtml(brand)}</td></tr><tr><td style="padding:34px 28px">${content}</td></tr><tr><td style="background:#f7f4ee;padding:20px 28px;text-align:center;color:#8c8275;font-size:11px;letter-spacing:1px">FIND YOUR SOUND.</td></tr></table></td></tr></table></body></html>`;

async function sendEmail(to:string,subject:string,html:string,replyTo:string) {
  const key=process.env.EMAIL_SERVICE_API_KEY;
  const from=process.env.EMAIL_FROM;
  if(!key||!from) throw new Error('Email service credentials are not configured.');
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],reply_to:replyTo,subject,html})});
  if(!response.ok){ const message=await response.text(); console.error('Email send failed',response.status,message); throw new Error('An order email could not be sent.'); }
}

export async function sendOrderEmails(order:Order) {
  const brand=process.env.BRAND_NAME||'KRISTONE GUITARS';
  const business=process.env.BUSINESS_EMAIL;
  const replyTo=process.env.EMAIL_REPLY_TO||business||'digitalbykristina@gmail.com';
  if(!business) throw new Error('BUSINESS_EMAIL is not configured.');
  const deliveryText = order.deliveryCharge === 0 ? 'FREE DELIVERY IN KATHMANDU' : order.deliveryChargeLabel;
  const admin=shell(brand,`New order ${order.orderId}`,`<p style="margin:0;color:#a57829;font-size:12px;font-weight:700;letter-spacing:2px">NEW ORDER RECEIVED</p><h1 style="font-family:Georgia,serif;font-size:30px;margin:10px 0 8px">A new guitar is on its way.</h1><p style="margin:0 0 24px;color:#756d62;font-size:14px">Order ${escapeHtml(order.orderId)} · ${escapeHtml(order.dateTime)}</p><table role="presentation" width="100%">${row('Customer',order.fullName)}${row('Phone',order.phone)}${row('Email',order.email)}${row('Province',order.province)}${row('District',order.district)}${row('Municipality/City',order.municipality)}${row('Full address',order.fullAddress)}${row('Product',order.productName)}${row('Color choice',order.colorChoice)}${row('Custom color',order.customColor || '-')}${row('Quantity',order.quantity)}${row('Price per piece',formatNpr(order.unitPrice))}${row('Delivery charge',deliveryText)}${row('Total amount',order.totalAmountLabel)}${row('Payment',order.paymentMethod)}${row('Status',order.orderStatus)}</table><div style="margin-top:24px;padding:16px;border-left:4px solid #caa052;background:#fbf6eb;font-weight:700;font-size:14px">Please call the customer soon to confirm delivery and final quote if needed.</div>`);
  const customer=shell(brand,`We received your order ${order.orderId}`,`<p style="margin:0;color:#a57829;font-size:12px;font-weight:700;letter-spacing:2px">ORDER RECEIVED</p><h1 style="font-family:Georgia,serif;font-size:30px;margin:10px 0 18px">Thank you, ${escapeHtml(order.fullName)}!</h1><p style="font-size:15px;line-height:1.7;color:#625b52">We have received your order successfully. Our sales representative will call you soon to confirm your order and delivery details.</p><table role="presentation" width="100%" style="margin-top:22px;border-top:1px solid #eee7dc">${row('Order ID',order.orderId)}${row('Product',order.productName)}${row('Color choice',order.colorChoice)}${row('Quantity',order.quantity)}${row('Delivery charge',deliveryText)}${row('Total amount',order.totalAmountLabel)}${row('Payment method',order.paymentMethod)}</table><p style="margin:26px 0 0;font-size:13px;color:#756d62">Questions? Reply to this email or contact ${escapeHtml(replyTo)}.<br><br>Thank you,<br><strong>${escapeHtml(brand)}</strong></p>`);
  await Promise.all([sendEmail(business,`New Product Order Received - ${order.orderId}`,admin,replyTo),sendEmail(order.email,`Your Order Has Been Received - ${brand}`,customer,replyTo)]);
}

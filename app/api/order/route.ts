import { NextResponse } from 'next/server';
import { validateOrder, type Order } from '@/lib/order';
import { appendOrder } from '@/lib/google-sheets';
import { sendOrderEmails } from '@/lib/email';
import { resolveDeliveryAssessment } from '@/lib/delivery';
import { PRODUCT, formatNpr } from '@/lib/product';

export async function POST(request:Request) {
  const origin=request.headers.get('origin');
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
  ].filter(Boolean).map((value) => {
    try { return new URL(value as string).origin; } catch { return null; }
  }).filter((value): value is string => Boolean(value));
  if (origin && !configuredOrigins.includes(origin)) {
    console.warn('[order] rejected origin', { origin, allowedOrigins: configuredOrigins });
    return NextResponse.json({success:false,error:'Origin not allowed.'},{status:403});
  }
  try {
    const body=await request.json();
    const validated=validateOrder(body);
    if(!validated.data) return NextResponse.json({success:false,error:'Please check the highlighted fields.',fields:validated.errors},{status:400});
    const now=new Date();
    const deliveryAssessment=resolveDeliveryAssessment(validated.data);
    const deliveryCharge=deliveryAssessment.charge;
    const totalAmount=validated.data.unitPrice*validated.data.quantity+(deliveryCharge??0);
    const order:Order={...validated.data,orderId:`KRG-${now.toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`,dateTime:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'medium',timeStyle:'short'}).format(now),deliveryAssessment,deliveryCharge,deliveryChargeLabel:deliveryAssessment.chargeLabel,totalAmount,totalAmountLabel:deliveryAssessment.charge===null ? 'To be confirmed after address review' : formatNpr(totalAmount),paymentMethod:'Cash On Delivery',orderStatus:'New Order'};
    const hasSheets=Boolean(process.env.GOOGLE_SHEET_ID&&process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&process.env.GOOGLE_PRIVATE_KEY);
    const smtpVariables = ['EMAIL_SMTP_HOST', 'EMAIL_SMTP_PORT', 'EMAIL_SMTP_USER', 'EMAIL_SMTP_PASSWORD', 'EMAIL_FROM', 'BUSINESS_EMAIL'];
    const missingSmtpVariables = smtpVariables.filter((name) => !process.env[name]);
    const resendVariables = ['EMAIL_SERVICE_API_KEY', 'EMAIL_FROM', 'BUSINESS_EMAIL'];
    const missingResendVariables = resendVariables.filter((name) => !process.env[name]);
    const hasSmtpEmail = missingSmtpVariables.length === 0;
    const hasResendEmail = missingResendVariables.length === 0;
    const hasEmail = hasSmtpEmail || hasResendEmail;
    if(hasSheets) {
      try { await appendOrder(order); console.info('[order] saved to Google Sheets', { orderId: order.orderId }); }
      catch(error) { console.error('[order] Google Sheets append failed', { orderId: order.orderId, error: error instanceof Error ? error.message : error }); }
    }
    if(hasEmail) {
      console.log('[email] starting send', { orderId: order.orderId, transport: hasSmtpEmail ? 'smtp' : 'resend' });
      try {
        await sendOrderEmails(order);
        console.info('[email] send completed', { orderId: order.orderId });
        console.info('[order] confirmation emails sent', { orderId: order.orderId });
      } catch(error) {
        console.error('[email] send failed', { orderId: order.orderId, error: error instanceof Error ? { name: error.name, message: error.message, code: (error as NodeJS.ErrnoException).code } : error });
        console.error('[order] email send failed', { orderId: order.orderId, error: error instanceof Error ? error.message : error });
      }
    } else {
      console.warn('[email] send skipped; missing environment variables', {
        smtpMissing: missingSmtpVariables,
        resendMissing: missingResendVariables,
      });
    }
    return NextResponse.json({success:true,orderId:order.orderId,productName:order.productName,quantity:order.quantity,totalAmount:order.totalAmount,totalAmountLabel:order.totalAmountLabel,deliveryCharge:order.deliveryCharge,deliveryChargeLabel:order.deliveryChargeLabel,deliveryNote:deliveryAssessment.note,productPrice:formatNpr(PRODUCT.price),paymentMethod:order.paymentMethod,colorChoice:order.colorChoice,customColor:order.customColor,province:order.province,district:order.district,municipality:order.municipality,fullAddress:order.fullAddress});
  } catch(error) {
    console.error('Order submission failed',error);
    const message=error instanceof Error ? error.message : 'Order submission failed.';
    return NextResponse.json({success:false,error:message},{status:500});
  }
}

import { NextResponse } from 'next/server';
import { validateOrder, type Order } from '@/lib/order';
import { appendOrder } from '@/lib/google-sheets';
import { sendOrderEmails } from '@/lib/email';
import { resolveDeliveryAssessment } from '@/lib/delivery';
import { PRODUCT, formatNpr } from '@/lib/product';

export async function POST(request:Request) {
  const allowed=process.env.FRONTEND_URL;
  const origin=request.headers.get('origin');
  if(allowed&&origin&&new URL(allowed).origin!==origin) return NextResponse.json({success:false,error:'Origin not allowed.'},{status:403});
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
    const hasEmail=Boolean(process.env.EMAIL_SERVICE_API_KEY&&process.env.EMAIL_FROM&&process.env.BUSINESS_EMAIL);
    if(hasSheets) {
      try { await appendOrder(order); }
      catch(error) { console.error('Google Sheets append failed',error); }
    }
    if(hasEmail) {
      try { await sendOrderEmails(order); }
      catch(error) { console.error('Email send failed',error); }
    }
    return NextResponse.json({success:true,orderId:order.orderId,productName:order.productName,quantity:order.quantity,totalAmount:order.totalAmount,totalAmountLabel:order.totalAmountLabel,deliveryCharge:order.deliveryCharge,deliveryChargeLabel:order.deliveryChargeLabel,deliveryNote:deliveryAssessment.note,productPrice:formatNpr(PRODUCT.price),paymentMethod:order.paymentMethod,colorChoice:order.colorChoice,customColor:order.customColor,province:order.province,district:order.district,municipality:order.municipality,fullAddress:order.fullAddress});
  } catch(error) {
    console.error('Order submission failed',error);
    const message=error instanceof Error ? error.message : 'Order submission failed.';
    return NextResponse.json({success:false,error:message},{status:500});
  }
}

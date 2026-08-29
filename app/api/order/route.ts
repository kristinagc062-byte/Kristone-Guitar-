import { NextResponse } from 'next/server';
import { validateOrder, type Order } from '@/lib/order';
import { appendOrder } from '@/lib/google-sheets';
import { sendOrderEmails } from '@/lib/email';

export async function POST(request:Request) {
  const allowed=process.env.FRONTEND_URL;
  const origin=request.headers.get('origin');
  if(allowed&&origin&&new URL(allowed).origin!==origin) return NextResponse.json({success:false,error:'Origin not allowed.'},{status:403});
  try {
    const body=await request.json();
    const validated=validateOrder(body);
    if(!validated.data) return NextResponse.json({success:false,error:'Please check the highlighted fields.',fields:validated.errors},{status:400});
    const now=new Date();
    const order:Order={...validated.data,orderId:`KRG-${now.toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomUUID().slice(0,6).toUpperCase()}`,dateTime:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'medium',timeStyle:'short'}).format(now),paymentMethod:'Cash On Delivery',orderStatus:'New Order'};
    await appendOrder(order);
    await sendOrderEmails(order);
    return NextResponse.json({success:true,orderId:order.orderId,productName:order.productName,quantity:order.quantity,totalPrice:order.totalPrice});
  } catch(error) {
    console.error('Order submission failed',error);
    const message=error instanceof Error ? error.message : 'Order submission failed.';
    return NextResponse.json({success:false,error:message},{status:500});
  }
}

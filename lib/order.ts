import { PRODUCT } from '@/lib/product';

export type OrderInput = { fullName:string; phone:string; email:string; location:string; productName:string; quantity:number; unitPrice:number; totalPrice:number; notes?:string };
export type Order = OrderInput & { orderId:string; dateTime:string; paymentMethod:'Cash On Delivery'; orderStatus:'New Order' };

export function validateOrder(value: unknown): { data?: OrderInput; errors?: Record<string,string> } {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string,unknown>;
  const data: OrderInput = { fullName:String(v.fullName??'').trim(), phone:String(v.phone??'').trim(), email:String(v.email??'').trim().toLowerCase(), location:String(v.location??'').trim(), productName:String(v.productName??'').trim(), quantity:Number(v.quantity), unitPrice:Number(v.unitPrice), totalPrice:Number(v.totalPrice), notes:String(v.notes??'').trim().slice(0,500) };
  const errors: Record<string,string> = {};
  if (data.fullName.length < 2) errors.fullName='Please enter your full name.';
  if (!/^\+?[0-9\s()-]{7,20}$/.test(data.phone)) errors.phone='Please enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email='Please enter a valid email address.';
  if (data.location.length < 5) errors.location='Kindly share your exact location.';
  if (data.productName !== PRODUCT.name) errors.productName='Invalid product.';
  if (!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>10) errors.quantity='Quantity must be between 1 and 10.';
  if (data.unitPrice!==PRODUCT.price) errors.unitPrice='Invalid unit price.';
  if (data.totalPrice!==PRODUCT.price*data.quantity) errors.totalPrice='Invalid total price.';
  return Object.keys(errors).length ? { errors } : { data };
}

export const escapeHtml = (value:string|number) => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));

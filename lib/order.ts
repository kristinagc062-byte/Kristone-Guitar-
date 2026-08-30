import { PRODUCT } from '@/lib/product';
import { type DeliveryAssessment, type DeliveryLocation } from '@/lib/delivery';

export type ColorChoice = 'Black' | 'Coffee' | 'Custom';

export type OrderInput = DeliveryLocation & {
  fullName: string;
  phone: string;
  email: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  colorChoice: ColorChoice;
  customColor: string;
  notes?: string;
};

export type Order = OrderInput & {
  orderId: string;
  dateTime: string;
  deliveryAssessment: DeliveryAssessment;
  deliveryCharge: number | null;
  deliveryChargeLabel: string;
  totalAmount: number;
  totalAmountLabel: string;
  paymentMethod: 'Cash On Delivery';
  orderStatus: 'New Order';
};

const normalize = (value: unknown) => String(value ?? '').trim();
const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export function validateOrder(value: unknown): { data?: OrderInput; errors?: Record<string, string> } {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const data: OrderInput = {
    fullName: normalize(v.fullName),
    phone: normalize(v.phone),
    email: normalize(v.email).toLowerCase(),
    province: normalize(v.province),
    district: normalize(v.district),
    municipality: normalize(v.municipality),
    fullAddress: normalize(v.fullAddress),
    productName: normalize(v.productName),
    quantity: Number(v.quantity),
    unitPrice: Number(v.unitPrice),
    colorChoice: normalize(v.colorChoice) === 'Custom Color' ? 'Custom' : ((normalize(v.colorChoice) as ColorChoice) || 'Coffee'),
    customColor: normalize(v.customColor),
    notes: normalize(v.notes).slice(0, 500),
  };

  const errors: Record<string, string> = {};
  if (data.fullName.length < 2) errors.fullName = 'Please enter your full name.';
  if (!/^\+?[0-9\s()-]{7,20}$/.test(data.phone)) errors.phone = 'Please enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address.';
  if (data.province.length < 2) errors.province = 'Please select your province.';
  if (data.district.length < 2) errors.district = 'Please enter your district.';
  if (data.municipality.length < 2) errors.municipality = 'Please enter your municipality or city.';
  if (data.fullAddress.length < 8) errors.fullAddress = 'Please enter your full delivery address.';
  if (data.productName !== PRODUCT.name) errors.productName = 'Invalid product.';
  if (!Number.isInteger(data.quantity) || data.quantity < 1 || data.quantity > 10) errors.quantity = 'Quantity must be between 1 and 10.';
  if (data.unitPrice !== PRODUCT.price) errors.unitPrice = 'Invalid unit price.';
  if (!['Black', 'Coffee', 'Custom', 'Custom Color'].includes(data.colorChoice)) errors.colorChoice = 'Please choose a guitar color.';
  if (data.colorChoice === 'Custom Color') data.colorChoice = 'Custom';
  if (data.colorChoice === 'Custom' && !isHexColor(data.customColor)) errors.customColor = 'Please choose a valid custom color.';

  return Object.keys(errors).length ? { errors } : { data };
}

export const escapeHtml = (value: string | number) => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));

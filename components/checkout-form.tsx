'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, MapPinned, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCT, formatNpr } from '@/lib/product';
import { resolveDeliveryAssessment } from '@/lib/delivery';
import type { ColorChoice } from '@/lib/order';

type Fields = {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  municipality: string;
  fullAddress: string;
  notes: string;
  colorChoice: ColorChoice;
  customColor: string;
};

const empty: Fields = {
  fullName: '',
  phone: '',
  email: '',
  province: '',
  district: '',
  municipality: '',
  fullAddress: '',
  notes: '',
  colorChoice: 'Coffee',
  customColor: '#7a4a28',
};

const colorOptions: Array<{ value: ColorChoice; label: string; swatch: string }> = [
  { value: 'Black', label: 'Black', swatch: '#0b0b0c' },
  { value: 'Coffee', label: 'Coffee', swatch: '#6f4323' },
  { value: 'Custom', label: 'Custom', swatch: '#caa052' },
];

export function CheckoutForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(empty);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const q = Number(new URLSearchParams(window.location.search).get('quantity'));
    if (Number.isInteger(q) && q >= 1 && q <= 10) setQuantity(q);
  }, []);

  const update = (key: keyof Fields, value: string) => {
    setFields(v => ({ ...v, [key]: value }));
    setErrors(v => ({ ...v, [key]: '' }));
  };

  const delivery = resolveDeliveryAssessment({
    province: fields.province,
    district: fields.district,
    municipality: fields.municipality,
    fullAddress: fields.fullAddress,
  });
  const subtotal = PRODUCT.price * quantity;
  const totalPreview = delivery.charge === null ? `${formatNpr(subtotal)} + delivery` : formatNpr(subtotal + delivery.charge);
  const deliveryPreview = delivery.charge === null ? delivery.chargeLabel : delivery.charge === 0 ? delivery.chargeLabel : delivery.chargeLabel;
  const selectedColor = fields.colorChoice === 'Custom' ? fields.customColor : fields.colorChoice === 'Black' ? '#0b0b0c' : '#6f4323';
  const previewImageSrc =
    fields.colorChoice === 'Black'
      ? '/images/kristone-guitar-black.png'
      : fields.colorChoice === 'Coffee'
        ? '/images/kristone-guitar-coffee.png'
        : '/images/kristone-lifestyle.png';
  const previewOverlayStyle =
    fields.colorChoice === 'Custom'
      ? { background: `linear-gradient(180deg, transparent 0%, transparent 50%, ${selectedColor} 100%)`, mixBlendMode: 'color' as const }
      : undefined;
  const activeOption = colorOptions.find(option => option.value === fields.colorChoice) ?? colorOptions[1];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage('');
    setErrors({});

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          productName: PRODUCT.name,
          quantity,
          unitPrice: PRODUCT.price,
        }),
      });
      const result = await response.json() as {
        success: boolean;
        error?: string;
        fields?: Record<string, string>;
        orderId?: string;
        totalAmountLabel?: string;
        totalAmount?: number;
        deliveryCharge?: number | null;
        deliveryChargeLabel?: string;
        deliveryNote?: string;
      };

      if (!response.ok || !result.success) {
        setErrors(result.fields || {});
        throw new Error(result.error || 'We could not submit your order. Please try again.');
      }

      const params = new URLSearchParams({
        orderId: result.orderId || '',
        product: PRODUCT.name,
        quantity: String(quantity),
        total: String(result.totalAmount ?? subtotal),
        totalLabel: result.totalAmountLabel || totalPreview,
        deliveryCharge: result.deliveryCharge === null || typeof result.deliveryCharge === 'undefined' ? '' : String(result.deliveryCharge),
        deliveryLabel: result.deliveryChargeLabel || deliveryPreview,
        deliveryNote: result.deliveryNote || delivery.note,
        colorChoice: fields.colorChoice,
        customColor: fields.customColor,
        province: fields.province,
        district: fields.district,
        municipality: fields.municipality,
        fullAddress: fields.fullAddress,
      });
      router.push(`/thank-you?${params}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not submit your order. Please try again.');
      setSubmitting(false);
    }
  };

  const fieldClass = 'h-12 rounded-xl border-white/10 bg-white/[0.035] px-4 text-white placeholder:text-stone-600 focus-visible:border-gold';
  const textareaClass = 'min-h-28 rounded-xl border-white/10 bg-white/[0.035] px-4 py-3 text-white placeholder:text-stone-600 focus-visible:border-gold';

  return (
    <main className="min-h-screen bg-[#090908] text-white">
      <header className="border-b border-white/8 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Brand />
          <p className="text-right text-[10px] uppercase tracking-[0.18em] text-stone-500 sm:text-xs">Secure checkout</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:py-16">
        <section>
          <p className="eyebrow">Secure checkout</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Where should we deliver your guitar?</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-400">
            FREE DELIVERY IN KATHMANDU. For locations outside Kathmandu Valley, the delivery charge will be calculated from your address and confirmed by our team before final processing.
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-5 rounded-[2rem] border border-gold/15 bg-[#12110f] p-5 sm:p-6" noValidate>
            <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
              <div className="space-y-5">
                <Field label="Full Name" error={errors.fullName}>
                  <Input value={fields.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Your full name" autoComplete="name" className={fieldClass} aria-invalid={!!errors.fullName} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone Number" error={errors.phone}>
                    <Input value={fields.phone} onChange={e => update('phone', e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" autoComplete="tel" className={fieldClass} aria-invalid={!!errors.phone} />
                  </Field>
                  <Field label="Email Address" error={errors.email}>
                    <Input type="email" value={fields.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" className={fieldClass} aria-invalid={!!errors.email} />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Province" error={errors.province}>
                    <Input value={fields.province} onChange={e => update('province', e.target.value)} placeholder="Bagmati" className={fieldClass} aria-invalid={!!errors.province} />
                  </Field>
                  <Field label="District" error={errors.district}>
                    <Input value={fields.district} onChange={e => update('district', e.target.value)} placeholder="Kathmandu" className={fieldClass} aria-invalid={!!errors.district} />
                  </Field>
                  <Field label="Municipality / City" error={errors.municipality}>
                    <Input value={fields.municipality} onChange={e => update('municipality', e.target.value)} placeholder="Kathmandu Metropolitan" className={fieldClass} aria-invalid={!!errors.municipality} />
                  </Field>
                </div>
                <Field label="Full Delivery Address" error={errors.fullAddress}>
                  <Textarea value={fields.fullAddress} onChange={e => update('fullAddress', e.target.value)} placeholder="House number, road, landmark, ward, and nearby location" className={textareaClass} aria-invalid={!!errors.fullAddress} />
                </Field>
                <Field label="Order Notes (optional)">
                  <Textarea value={fields.notes} onChange={e => update('notes', e.target.value)} placeholder="Landmark, preferred call time, or anything else" className="min-h-20 rounded-xl border-white/10 bg-white/[0.035] px-4 py-3 text-white placeholder:text-stone-600 focus-visible:border-gold" maxLength={500} />
                </Field>
              </div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={previewImageSrc}
                      alt="Kristone Premium Acoustic Guitar"
                      className="h-full w-full object-cover object-center transition duration-300"
                      style={fields.colorChoice === 'Custom' ? { filter: 'saturate(1.02) contrast(1.02)' } : undefined}
                    />
                    {previewOverlayStyle && <div className="absolute inset-0 opacity-90 transition duration-300" style={previewOverlayStyle} />}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                        <SparkleLabel active={activeOption.label} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 p-4 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Choose guitar color</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-400">Available in Black, Coffee, or Custom color</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {colorOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => update('colorChoice', option.value)}
                          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${fields.colorChoice === option.value ? 'border-gold bg-gold/10 text-white' : 'border-white/10 bg-white/[0.03] text-stone-300 hover:border-gold/40'}`}
                        >
                          <span className="size-8 rounded-full border border-white/15" style={{ backgroundColor: option.swatch }} />
                          <span className="text-sm font-semibold">{option.label}</span>
                        </button>
                      ))}
                    </div>
                    {fields.colorChoice === 'Custom' && (
                      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Custom color picker</p>
                          <p className="mt-1 text-sm text-stone-300">Choose the finish color for the guitar preview.</p>
                        </div>
                        <input type="color" value={fields.customColor} onChange={e => update('customColor', e.target.value)} className="h-12 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1" aria-label="Choose custom guitar color" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-gold/15 bg-black/35 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Delivery policy</p>
                  <div className="mt-3 space-y-2 text-sm text-stone-300">
                    <p>FREE DELIVERY IN KATHMANDU</p>
                    <p className="text-stone-400">Outside Kathmandu Valley, the delivery charge is calculated from your delivery location and confirmed by our team before final order processing.</p>
                  </div>
                </div>
              </div>
            </div>

            {message && <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{message}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-gold px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#e1bc73] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Submitting Order...
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" />
                  Place Order · {delivery.charge === null ? `${formatNpr(subtotal)} + delivery` : formatNpr(subtotal + delivery.charge)}
                </>
              )}
            </button>

            <p className="text-center text-xs leading-5 text-stone-500">
              Delivery charge for locations outside Kathmandu Valley will be calculated based on your delivery location and confirmed by our team.
            </p>
          </form>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#12110f]">
            <div className="border-b border-white/8 p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Your order</p>
              <h2 className="mt-2 font-serif text-2xl">{PRODUCT.name}</h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid gap-4">
                    <SummaryRow label="Color" value={fields.colorChoice === 'Custom' ? `Custom (${fields.customColor})` : fields.colorChoice} />
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                  <span className="text-xs uppercase tracking-widest text-stone-500">Quantity</span>
                  <div className="flex items-center rounded-full border border-white/15">
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-stone-300 hover:text-gold" aria-label="Decrease quantity">
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-9 px-1 text-center text-sm font-semibold">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))} className="p-2.5 text-stone-300 hover:text-gold" aria-label="Increase quantity">
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-500">Product Price</p>
                    <p className="mt-1 text-sm font-medium text-stone-200">{formatNpr(PRODUCT.price)}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">PER PIECE</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-500">Delivery</p>
                    <p className="mt-1 text-sm font-medium text-stone-200">{deliveryPreview}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{delivery.isFree ? 'FREE' : 'CALCULATED'}</span>
                </div>
                <div className="flex items-end justify-between border-t border-white/8 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-500">Total</p>
                    <p className="mt-1 text-sm text-stone-400">{delivery.isFree ? formatNpr(subtotal) : delivery.totalLabel === 'To be confirmed' ? 'Confirmed after address review' : delivery.totalLabel}</p>
                  </div>
                  <span className="font-serif text-3xl text-gold">{delivery.charge === null ? formatNpr(subtotal) : formatNpr(subtotal + delivery.charge)}</span>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black">
                <div className="aspect-[16/11] overflow-hidden">
                  <img src="/images/kristone-package.png" alt="Kristone acoustic guitar package" className="h-full w-full object-cover object-[center_65%]" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Included in the package</p>
                  <div className="mt-3 space-y-2 text-xs text-stone-400">
                    {['Protective guitar case', 'Phone confirmation before dispatch', 'FREE DELIVERY IN KATHMANDU'].map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <Check className="size-3.5 text-gold" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-xs text-stone-400">
                <div className="flex items-center gap-3"><Truck className="size-4 text-gold" /><span>FREE DELIVERY IN KATHMANDU</span></div>
                <div className="flex items-center gap-3"><MapPinned className="size-4 text-gold" /><span>Outside Valley delivery is location-based</span></div>
                <div className="flex items-center gap-3"><ShieldCheck className="size-4 text-gold" /><span>Cash on Delivery supported</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#12110f] p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold">Need help?</p>
            <div className="mt-3 space-y-2 text-sm text-stone-300">
              <p className="text-sm leading-6 text-stone-400">If you need help, reach us on WhatsApp and we’ll confirm the delivery details with you.</p>
              <a href="https://wa.me/9779769955462" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#e1bc73]">
                <Check className="size-4" />
                WhatsApp Support
              </a>
            </div>
          </div>

          <Link href="/" className="flex items-center justify-center gap-2 rounded-full border border-gold/50 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-gold hover:text-black">
            <ArrowLeft className="size-4" />
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-stone-300">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
      <span className="text-sm font-medium text-stone-200">{value}</span>
    </div>
  );
}

function SparkleLabel({ active }: { active: string }) {
  return <span>{active} preview</span>;
}

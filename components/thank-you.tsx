'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, MessageCircle } from 'lucide-react';
import { Brand } from '@/components/brand';
import { PRODUCT, formatNpr } from '@/lib/product';

type Summary = {
  orderId: string;
  product: string;
  quantity: number;
  total: number;
  totalLabel: string;
  deliveryLabel: string;
  deliveryNote: string;
  colorChoice: string;
  customColor: string;
  province: string;
  district: string;
  municipality: string;
  fullAddress: string;
};

const empty: Summary = {
  orderId: '',
  product: PRODUCT.name,
  quantity: 1,
  total: PRODUCT.price,
  totalLabel: formatNpr(PRODUCT.price),
  deliveryLabel: 'FREE DELIVERY IN KATHMANDU',
  deliveryNote: 'FREE DELIVERY IN KATHMANDU.',
  colorChoice: 'Coffee',
  customColor: '#7a4a28',
  province: '',
  district: '',
  municipality: '',
  fullAddress: '',
};

export function ThankYou() {
  const [data, setData] = useState<Summary>(empty);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const colorChoice = p.get('colorChoice') || 'Coffee';
    setData({
      orderId: p.get('orderId') || '',
      product: p.get('product') || PRODUCT.name,
      quantity: Number(p.get('quantity')) || 1,
      total: Number(p.get('total')) || PRODUCT.price,
      totalLabel: p.get('totalLabel') || formatNpr(Number(p.get('total')) || PRODUCT.price),
      deliveryLabel: p.get('deliveryLabel') || 'FREE DELIVERY IN KATHMANDU',
      deliveryNote: p.get('deliveryNote') || 'FREE DELIVERY IN KATHMANDU.',
      colorChoice: colorChoice === 'Custom Color' ? 'Custom' : colorChoice,
      customColor: p.get('customColor') || '#7a4a28',
      province: p.get('province') || '',
      district: p.get('district') || '',
      municipality: p.get('municipality') || '',
      fullAddress: p.get('fullAddress') || '',
    });
  }, []);

  const supportUrl = `https://wa.me/9779769955462?text=${encodeURIComponent(`Hi KRISTONE GUITARS, I just placed order ${data.orderId || ''}.`)}`;
  const colorText = data.colorChoice === 'Custom' ? `Custom (${data.customColor})` : data.colorChoice;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080807] px-5 py-8 text-white sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(202,160,82,.18),transparent_28%)]" />
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <Brand priority />
        </div>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-gold/20 bg-[#12110f] shadow-2xl">
          <div className="border-b border-white/8 px-6 py-12 text-center sm:px-12">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-gold text-black">
              <Check className="size-7" strokeWidth={3} />
            </div>
            <p className="eyebrow mt-7">Order received</p>
            <h1 className="font-serif text-4xl sm:text-6xl">Thank you for your order!</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-stone-400">
              We’ve received your order successfully. A confirmation has been sent to your email, and our team will follow up to confirm delivery and any outside-Valley charge if needed.
            </p>
          </div>

          <div className="px-6 py-8 sm:px-12">
            <div className="grid gap-5 sm:grid-cols-2">
              <Detail label="Order ID" value={data.orderId || 'Confirmed'} />
              <Detail label="Product ordered" value={data.product} />
              <Detail label="Quantity" value={String(data.quantity)} />
              <Detail label="Color" value={colorText} />
              <Detail label="Delivery" value={data.deliveryLabel} gold />
              <Detail label="Total" value={data.totalLabel || formatNpr(data.total)} gold />
            </div>

            <div className="mt-8 rounded-2xl border border-gold/20 bg-gold/[0.06] p-5">
              <div className="flex gap-4">
                <Check className="mt-0.5 size-5 shrink-0 text-gold" />
                <div className="text-sm leading-6 text-stone-300">
                  <p>Our sales representative will call you soon to confirm your order.</p>
                  <p className="mt-2">{data.deliveryNote}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl bg-black/25 p-4 text-sm text-stone-300 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Delivery address</p>
                  <p className="mt-1">{[data.municipality, data.district, data.province].filter(Boolean).join(', ')}</p>
                  <p className="mt-1 text-stone-400">{data.fullAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">Support</p>
                  <p className="mt-1 text-stone-400">Our team will confirm any delivery details with you on WhatsApp or by email.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a href={supportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#e1bc73]">
                  <MessageCircle className="size-4" />
                  WhatsApp Support
                </a>
                <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-300 transition hover:border-gold hover:text-gold">
                  <ArrowLeft className="size-4" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-7 text-center text-xs text-stone-600">KRISTONE GUITARS — FIND YOUR SOUND.</p>
      </div>
    </main>
  );
}

function Detail({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/[0.035] p-4">
      <p className="text-[10px] uppercase tracking-widest text-stone-500">{label}</p>
      <p className={`${gold ? 'text-gold' : 'text-white'} mt-1.5 text-sm font-semibold`}>{value}</p>
    </div>
  );
}

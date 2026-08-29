import Link from 'next/link';
export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="group inline-flex items-center gap-3" aria-label="Kristone Guitars home"><span className={`${compact ? 'size-9' : 'size-10'} grid place-items-center rounded-full border border-gold/45 text-gold transition group-hover:bg-gold group-hover:text-black`}><span className="font-serif text-xl italic">K</span></span><span><span className="block font-serif text-base tracking-[0.16em] text-white sm:text-lg">KRISTONE</span><span className="block text-[8px] tracking-[0.42em] text-gold">GUITARS</span></span></Link>;
}

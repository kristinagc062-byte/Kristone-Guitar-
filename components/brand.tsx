import Image from 'next/image';

export function Brand({ compact = false, hero = false, className = '', priority = false }: { compact?: boolean; hero?: boolean; className?: string; priority?: boolean }) {
  const widthClass = hero ? 'w-[204px] sm:w-[240px] lg:w-[272px]' : compact ? 'w-[114px] sm:w-[128px]' : 'w-[156px] sm:w-[180px]';
  return (
    <a href="/" className={`block shrink-0 ${widthClass} ${className}`} aria-label="Kristone Guitars home">
      <Image
        src="/images/kristone-logo.png"
        alt="KRISTONE GUITARS logo"
        width={1536}
        height={1024}
        priority={priority}
        className="h-auto w-full object-contain"
        sizes={compact ? '(max-width: 640px) 114px, 128px' : '(max-width: 640px) 156px, 180px'}
      />
    </a>
  );
}

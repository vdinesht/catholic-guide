/** The Catholic Guide mark: a gold cross over an open book. The cross stays gold in every season. */
export function LogoMark({ size = 30, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" className={inverse ? 'logo-mark inverse' : 'logo-mark'}>
      <rect x="29" y="3" width="6" height="53" rx="1.5" className="logo-cross" />
      <rect x="19" y="12" width="26" height="6" rx="1.5" className="logo-cross" />
      <path d="M27 30C20 25.5 12 24.5 4 26.5V55c8-2 16-1 23 3.5z" className="logo-book" />
      <path d="M37 30c7-4.5 15-5.5 23-3.5V55c-8-2-16-1-23 3.5z" className="logo-book" />
    </svg>
  );
}

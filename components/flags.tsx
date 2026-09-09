export function FlagGB({ size = 18 }: { size?: number }) {
  const w = size;
  const h = Math.round((size * 13) / 18);
  return (
    <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="18" height="13" fill="#012169" />
      <path d="M0,0 L18,13 M18,0 L0,13" stroke="#fff" strokeWidth="2.4" />
      <path d="M0,0 L18,13 M18,0 L0,13" stroke="#C8102E" strokeWidth="0.9" />
      <path d="M9,0 V13 M0,6.5 H18" stroke="#fff" strokeWidth="4" />
      <path d="M9,0 V13 M0,6.5 H18" stroke="#C8102E" strokeWidth="2.4" />
    </svg>
  );
}

export function FlagTH({ size = 18 }: { size?: number }) {
  const w = size;
  const h = Math.round((size * 13) / 18);
  return (
    <svg width={w} height={h} viewBox="0 0 18 13" aria-hidden="true" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="18" height="13" fill="#fff" />
      <rect y="0" width="18" height="2.2" fill="#A51931" />
      <rect y="10.8" width="18" height="2.2" fill="#A51931" />
      <rect y="2.2" width="18" height="2.15" fill="#F4F5F8" />
      <rect y="8.65" width="18" height="2.15" fill="#F4F5F8" />
      <rect y="4.35" width="18" height="4.3" fill="#2D2A4A" />
    </svg>
  );
}

/** Isometric block outline with a lightning bolt: a block, and the race to be inside it first. */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 3.5 7.25v9.5L12 21.5l8.5-4.75v-9.5L12 2.5Z"
        stroke="#fafafa"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.25 12 12l8.5-4.75M12 12v9.5"
        stroke="#fafafa"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path d="M13.6 6.5 8.6 13.4h3.2l-1.4 5.1 5.2-7.2h-3.2l1.2-4.8Z" fill="#fafafa" />
    </svg>
  );
}

// Marca do Gentoo — o "g" em espiral, versão SVG leve na paleta roxa.
export default function XLogo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const id = "gt-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Gentoo Linux"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7A6CA8" />
          <stop offset="55%" stopColor="#54487A" />
          <stop offset="100%" stopColor="#3E3559" />
        </linearGradient>
      </defs>
      {/* corpo em "g" espiralado — cabeça + laço inferior aberto */}
      <path
        fill={`url(#${id})`}
        d="M50 8C30.7 8 15 22.5 15 41c0 15.4 10.9 27.1 26.6 30.2-6.9 2.5-11.4 6.9-11.4 12.9 0 8.9 9.4 15.4 22.4 15.4 16 0 27.4-9 27.4-22.7 0-9.6-6.4-15.6-18.9-18.4C74.9 55.6 85 44.9 85 30.6 85 17 70.9 8 50 8Zm0 15c9.9 0 17.2 7.3 17.2 17.4S59.9 57.9 50 57.9 32.8 50.6 32.8 40.4 40.1 23 50 23Zm3.8 51.6c6.4 1.3 9.6 3.7 9.6 7.6 0 4.4-4.7 7.4-11.4 7.4-6.9 0-11.7-3.1-11.7-7.6 0-4 3.4-6.6 9.3-7.6 1.4.2 2.8.2 4.2.2Z"
      />
      {/* olho do g */}
      <circle cx="50" cy="40" r="6.5" fill="#F0C419" />
    </svg>
  );
}

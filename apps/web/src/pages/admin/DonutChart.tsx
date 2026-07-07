export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

// Küçük dilimlerde yüzde etiketi kalabalık/okunaksız görünür — sadece görünür şekilde
// okunabilecek büyüklükteki dilimlere etiket eklenir.
const LABEL_THRESHOLD = 0.08;

export function DonutChart({
  data,
  size = 148,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const slices = data.map((d) => {
    const fraction = total > 0 ? d.value / total : 0;
    const dash = fraction * circumference;
    const dashoffset = -cumulative;
    const startAngle = circumference > 0 ? (cumulative / circumference) * 360 : 0;
    const midAngle = startAngle + (fraction * 360) / 2;
    cumulative += dash;
    return { ...d, dash, dashoffset, fraction, midAngle };
  });

  // 0° = 12 o'clock, saat yönünde — dilimlerin çizildiği <g>'nin rotate(-90) dönüşümüyle aynı hizada.
  function polarPoint(angleDeg: number, r: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const summaryLabel = data.map((d) => `${d.label} ${Math.round((d.value / (total || 1)) * 100)}%`).join(", ");

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={summaryLabel}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-bg)" strokeWidth={thickness} />
          {slices.map((s) => (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </g>
        {slices
          .filter((s) => s.fraction >= LABEL_THRESHOLD)
          .map((s) => {
            const pos = polarPoint(s.midAngle, radius);
            return (
              <text
                key={`label-${s.label}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[9px] font-semibold"
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 3 }}
              >
                {Math.round(s.fraction * 100)}%
              </text>
            );
          })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="font-heading text-base font-semibold tabular-nums">{centerValue}</span>}
          {centerLabel && <span className="text-[10px] text-(--color-text-muted)">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

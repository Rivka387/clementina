export default function Ring({
  value,
  total = 6,
  small = false,
}: {
  value: number;
  total?: number;
  small?: boolean;
}) {
  return (
    <div
      className={'ring ' + (small ? 'ring-small' : '')}
      role="img"
      aria-label={`${value} מתוך ${total} סעיפים`}
    >
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="33" className="ring-track" />
        <circle
          cx="40"
          cy="40"
          r="33"
          className="ring-fill"
          strokeDasharray={`${Math.min(value / total, 1) * 207.35} 207.35`}
        />
      </svg>
      <span>
        <b>{value}</b>
        <small> / {total}</small>
      </span>
    </div>
  );
}

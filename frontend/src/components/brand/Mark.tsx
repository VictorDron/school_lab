/**
 * agente school — brand mark.
 *
 * Per agente-lab brand manual (DOT · Iris):
 *   "agente" semibold + "school" regular gray + iris dot at end.
 *   The dot is the ONLY graphic element of the mark — and carries the signal:
 *   status, pulse, presence.
 */

interface MarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Inverted = paper text on ink surface */
  inverted?: boolean;
  /** Pulse the dot (live system indicator) */
  pulse?: boolean;
  className?: string;
  /** The vertical name. Defaults to "school". */
  vertical?: string;
}

const SIZE: Record<NonNullable<MarkProps['size']>, { font: string; tracking: string; dot: string; gap: string }> = {
  xs: { font: '14px',  tracking: '-0.040em', dot: '3px',  gap: '2px' },
  sm: { font: '18px',  tracking: '-0.045em', dot: '4px',  gap: '3px' },
  md: { font: '28px',  tracking: '-0.050em', dot: '6px',  gap: '5px' },
  lg: { font: '56px',  tracking: '-0.050em', dot: '11px', gap: '9px' },
  xl: { font: '96px',  tracking: '-0.055em', dot: '18px', gap: '12px' },
};

export default function Mark({
  size = 'md',
  inverted = false,
  pulse = false,
  className = '',
  vertical = 'school',
}: MarkProps) {
  const cfg = SIZE[size];
  const nameColor = inverted ? '#F4F2EC' : '#0E0D0B';
  const verticalColor = inverted ? 'rgba(244,242,236,0.6)' : '#5C5A54';

  return (
    <span
      className={`inline-flex items-baseline font-sans leading-none ${className}`}
      style={{
        fontSize: cfg.font,
        letterSpacing: cfg.tracking,
        color: nameColor,
      }}
    >
      <span style={{ fontWeight: 600 }}>agente</span>
      <span style={{ fontWeight: 400, color: verticalColor, marginLeft: '0.28em' }}>
        {vertical}
      </span>
      <span
        aria-hidden
        className={pulse ? 'animate-iris-pulse' : ''}
        style={{
          display: 'inline-block',
          width: cfg.dot,
          height: cfg.dot,
          marginLeft: cfg.gap,
          alignSelf: 'flex-end',
          marginBottom: '0.18em',
          borderRadius: '50%',
          background: '#6B4FFF',
          flexShrink: 0,
        }}
      />
    </span>
  );
}

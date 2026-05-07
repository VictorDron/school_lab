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
  xs: { font: '14px',                            tracking: '-0.040em', dot: '3px',                          gap: '2px' },
  sm: { font: '18px',                            tracking: '-0.045em', dot: '4px',                          gap: '3px' },
  md: { font: 'clamp(22px, 4.5vw, 28px)',        tracking: '-0.050em', dot: 'clamp(5px, 0.95vw, 6px)',      gap: 'clamp(4px, 0.8vw, 5px)' },
  lg: { font: 'clamp(36px, 8vw, 56px)',          tracking: '-0.050em', dot: 'clamp(7px, 1.6vw, 11px)',      gap: 'clamp(5px, 1.3vw, 9px)' },
  xl: { font: 'clamp(44px, 13vw, 96px)',         tracking: '-0.055em', dot: 'clamp(8px, 2.5vw, 18px)',      gap: 'clamp(6px, 1.6vw, 12px)' },
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
      <img
        src="/agente.png"
        alt=""
        aria-hidden
        style={{
          height: '1.1em',
          width: '1.1em',
          objectFit: 'contain',
          marginRight: '0.32em',
          alignSelf: 'center',
          filter: inverted ? 'invert(1)' : 'none',
          flexShrink: 0,
        }}
      />
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

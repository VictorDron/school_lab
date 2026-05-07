/**
 * agente school — brand mark.
 *
 * Renders the official wordmark PNG (agente.school with green dot).
 * Light variant on paper, dark variant on ink.
 */

interface MarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Inverted = paper text on ink surface */
  inverted?: boolean;
  /** Kept for API compatibility — no-op now that the dot is part of the image. */
  pulse?: boolean;
  className?: string;
}

const HEIGHT: Record<NonNullable<MarkProps['size']>, string> = {
  xs: '14px',
  sm: '22px',
  md: 'clamp(26px, 5vw, 34px)',
  lg: 'clamp(44px, 9vw, 64px)',
  xl: 'clamp(56px, 15vw, 112px)',
};

export default function Mark({
  size = 'md',
  inverted = false,
  className = '',
}: MarkProps) {
  const src = inverted
    ? '/agente-school-full-dark.png'
    : '/agente-school-full-light.png';

  return (
    <img
      src={src}
      alt="agente school"
      className={`inline-block select-none ${className}`}
      style={{
        height: HEIGHT[size],
        width: 'auto',
        objectFit: 'contain',
      }}
    />
  );
}

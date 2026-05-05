import { useState } from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string | null;
  avatarUrl?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-success-100 text-success-700',
    'bg-warning-100 text-warning-700',
    'bg-error-100 text-error-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ src, avatarUrl, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  const imageUrl = src || avatarUrl;

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={clsx(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-medium',
        sizes[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

import {
  Activity,
  AlertCircle,
  Key,
  LogIn,
  LogOut,
  Mail,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
} from 'lucide-react';
import { actionCategories } from './constants';

export const getActionInfo = (
  action: string
): { category: string; icon: typeof Activity; color: string; label: string } => {
  for (const [category, config] of Object.entries(actionCategories)) {
    if (config.actions.includes(action)) {
      let icon = config.icon;
      if (action === 'LOGIN_SUCCESS') icon = LogIn;
      if (action === 'LOGIN_FAILURE') icon = AlertCircle;
      if (action === 'LOGOUT') icon = LogOut;
      if (action === 'USER_CREATED') icon = UserPlus;
      if (action === 'USER_DELETED') icon = UserMinus;
      if (action === 'USER_ACTIVATED') icon = UserCheck;
      if (action === 'USER_ARCHIVED') icon = UserX;
      if (action === 'INVITE_SENT') icon = Mail;
      if (action === 'PASSWORD_RESET' || action === 'PASSWORD_CHANGED') icon = Key;

      return {
        category,
        icon,
        color: config.color,
        label: action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      };
    }
  }
  return { category: 'OTHER', icon: Activity, color: 'gray', label: action.replace(/_/g, ' ') };
};

export const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; badge: string; activeBorder: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', activeBorder: 'border-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', activeBorder: 'border-purple-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', activeBorder: 'border-orange-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700', activeBorder: 'border-green-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', activeBorder: 'border-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', activeBorder: 'border-amber-500' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', activeBorder: 'border-pink-500' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', activeBorder: 'border-cyan-500' },
    gray: { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200', badge: 'bg-neutral-100 text-neutral-700', activeBorder: 'border-neutral-500' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700', activeBorder: 'border-red-500' },
  };
  return colors[color] || colors.gray;
};

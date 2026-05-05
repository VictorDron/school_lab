import { describe, it, expect } from 'vitest';
import {
  Activity,
  AlertCircle,
  Key,
  LogIn,
  LogOut,
  Mail,
  Shield,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
} from 'lucide-react';
import { getActionInfo, getColorClasses } from '../helpers';

describe('getActionInfo', () => {
  it('maps LOGIN_SUCCESS to AUTH category with LogIn icon', () => {
    const info = getActionInfo('LOGIN_SUCCESS');
    expect(info.category).toBe('AUTH');
    expect(info.icon).toBe(LogIn);
    expect(info.color).toBe('blue');
    expect(info.label).toBe('Login success');
  });

  it('maps LOGIN_FAILURE to AUTH category with AlertCircle icon', () => {
    const info = getActionInfo('LOGIN_FAILURE');
    expect(info.category).toBe('AUTH');
    expect(info.icon).toBe(AlertCircle);
  });

  it('maps LOGOUT to AUTH with LogOut icon', () => {
    const info = getActionInfo('LOGOUT');
    expect(info.category).toBe('AUTH');
    expect(info.icon).toBe(LogOut);
  });

  it('maps PASSWORD_RESET and PASSWORD_CHANGED to AUTH with Key icon', () => {
    expect(getActionInfo('PASSWORD_RESET').icon).toBe(Key);
    expect(getActionInfo('PASSWORD_CHANGED').icon).toBe(Key);
  });

  it('maps USER_CREATED/DELETED/ACTIVATED/ARCHIVED to USER with their specific icons', () => {
    expect(getActionInfo('USER_CREATED').icon).toBe(UserPlus);
    expect(getActionInfo('USER_DELETED').icon).toBe(UserMinus);
    expect(getActionInfo('USER_ACTIVATED').icon).toBe(UserCheck);
    expect(getActionInfo('USER_ARCHIVED').icon).toBe(UserX);
    expect(getActionInfo('USER_CREATED').category).toBe('USER');
    expect(getActionInfo('USER_CREATED').color).toBe('purple');
  });

  it('maps INVITE_SENT to USER with Mail icon', () => {
    const info = getActionInfo('INVITE_SENT');
    expect(info.category).toBe('USER');
    expect(info.icon).toBe(Mail);
  });

  it('uses category default icon for actions without a specific override', () => {
    const info = getActionInfo('PASSWORD_CHANGE_FAILURE');
    expect(info.category).toBe('AUTH');
    expect(info.icon).toBe(Shield);
  });

  it('maps LEAD_CREATED to CRM with TrendingUp icon', () => {
    const info = getActionInfo('LEAD_CREATED');
    expect(info.category).toBe('CRM');
    expect(info.icon).toBe(TrendingUp);
    expect(info.color).toBe('pink');
  });

  it('falls back to OTHER/Activity/gray for unknown actions', () => {
    const info = getActionInfo('SOMETHING_UNKNOWN');
    expect(info.category).toBe('OTHER');
    expect(info.icon).toBe(Activity);
    expect(info.color).toBe('gray');
    expect(info.label).toBe('SOMETHING UNKNOWN');
  });

  it('label transforms underscores to spaces and capitalizes first letter for known actions', () => {
    expect(getActionInfo('TICKET_ASSIGNED').label).toBe('Ticket assigned');
    expect(getActionInfo('PURCHASE_APPROVED').label).toBe('Purchase approved');
  });
});

describe('getColorClasses', () => {
  it('returns the matching palette for known colors', () => {
    const blue = getColorClasses('blue');
    expect(blue.bg).toBe('bg-blue-50');
    expect(blue.text).toBe('text-blue-700');
    expect(blue.badge).toBe('bg-blue-100 text-blue-700');
    expect(blue.activeBorder).toBe('border-blue-500');
  });

  it('returns the gray palette as fallback for unknown colors', () => {
    const fallback = getColorClasses('not-a-color');
    expect(fallback.bg).toBe('bg-neutral-50');
    expect(fallback.text).toBe('text-neutral-700');
    expect(fallback.badge).toBe('bg-neutral-100 text-neutral-700');
  });

  it('returns the gray palette when called with the gray key directly', () => {
    expect(getColorClasses('gray')).toEqual(getColorClasses('not-a-color'));
  });

  it('exposes red palette for failure highlights', () => {
    const red = getColorClasses('red');
    expect(red.text).toBe('text-red-700');
    expect(red.badge).toBe('bg-red-100 text-red-700');
  });
});

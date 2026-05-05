import { describe, it, expect, vi } from 'vitest';
import { applyFieldValidation, clearFieldError, setFieldError } from '../helpers';

type Errors = Record<string, string>;

function makeMockSetter(initial: Errors = {}) {
  let current = initial;
  const setter = vi.fn((updater: Errors | ((prev: Errors) => Errors)) => {
    current = typeof updater === 'function' ? updater(current) : updater;
  });
  return {
    setter,
    get state() {
      return current;
    },
  };
}

describe('setFieldError', () => {
  it('adds the message under the given key without touching unrelated keys', () => {
    const mock = makeMockSetter({ 'other.field': 'kept' });
    setFieldError('father.email', 'Email inválido', mock.setter);
    expect(mock.setter).toHaveBeenCalledTimes(1);
    expect(mock.state).toEqual({
      'other.field': 'kept',
      'father.email': 'Email inválido',
    });
  });

  it('overwrites an existing message for the same key', () => {
    const mock = makeMockSetter({ 'father.email': 'old' });
    setFieldError('father.email', 'new', mock.setter);
    expect(mock.state).toEqual({ 'father.email': 'new' });
  });
});

describe('clearFieldError', () => {
  it('removes the entry under the given key and leaves siblings intact', () => {
    const mock = makeMockSetter({
      'father.email': 'Email inválido',
      'mother.email': 'Email inválido',
    });
    clearFieldError('father.email', mock.setter);
    expect(mock.state).toEqual({ 'mother.email': 'Email inválido' });
  });

  it('returns the same reference when the key is absent so React can skip the render', () => {
    const initial = { 'mother.email': 'Email inválido' };
    const mock = makeMockSetter(initial);
    clearFieldError('father.email', mock.setter);
    expect(mock.state).toBe(initial);
  });
});

describe('applyFieldValidation', () => {
  it('clears the field error when the value is valid', () => {
    const mock = makeMockSetter({ 'father.email': 'Email inválido' });
    applyFieldValidation('father.email', true, 'Email inválido', mock.setter);
    expect(mock.state).toEqual({});
  });

  it('sets the field error when the value is invalid', () => {
    const mock = makeMockSetter({});
    applyFieldValidation('father.email', false, 'Email inválido', mock.setter);
    expect(mock.state).toEqual({ 'father.email': 'Email inválido' });
  });

  it('replaces a previous message when the new validation also fails', () => {
    const mock = makeMockSetter({ 'student.cpf': 'old' });
    applyFieldValidation('student.cpf', false, 'CPF inválido', mock.setter);
    expect(mock.state).toEqual({ 'student.cpf': 'CPF inválido' });
  });

  it('does not throw when clearing a key that was never set', () => {
    const mock = makeMockSetter({});
    expect(() => applyFieldValidation('mother.email', true, 'whatever', mock.setter)).not.toThrow();
    expect(mock.state).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Field error helpers — collapse the repeated set/delete pattern that every
// onBlur validation handler in this step used to inline.
// ---------------------------------------------------------------------------

type SetFieldErrors = React.Dispatch<React.SetStateAction<Record<string, string>>>;

export function clearFieldError(key: string, setFieldErrors: SetFieldErrors): void {
  setFieldErrors(prev => {
    if (!(key in prev)) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

export function setFieldError(key: string, message: string, setFieldErrors: SetFieldErrors): void {
  setFieldErrors(prev => ({ ...prev, [key]: message }));
}

export function applyFieldValidation(
  key: string,
  isValid: boolean,
  message: string,
  setFieldErrors: SetFieldErrors,
): void {
  if (isValid) {
    clearFieldError(key, setFieldErrors);
  } else {
    setFieldError(key, message, setFieldErrors);
  }
}

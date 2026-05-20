import { useState, useCallback } from 'react';
import { useAuth } from '../auth-context';

type FormMode = 'login' | 'register';

export function useAuthForm(mode: FormMode) {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = useCallback(() => {
    if (!email.trim() || !password) return 'Please fill in all fields';
    if (mode === 'register') {
      if (!name.trim()) return 'Please fill in all fields';
      if (password !== confirm) return 'Passwords do not match';
      if (password.length < 6) return 'Password must be at least 6 characters';
    }
    return null;
  }, [email, password, name, confirm, mode]);

  const submit = useCallback(async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return validationError;
    }
    setLoading(true);
    const err = mode === 'login'
      ? await signIn(email.trim().toLowerCase(), password)
      : await signUp(email.trim().toLowerCase(), password, name.trim());
    setLoading(false);
    if (err) setError(err);
    return err;
  }, [email, password, name, mode, signIn, signUp, validate]);

  const reset = useCallback(() => {
    setError('');
  }, []);

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    confirm, setConfirm,
    error, setError,
    loading, submit, reset,
  };
}

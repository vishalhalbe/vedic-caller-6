import { useState } from 'react';
import { useAuth } from '../auth-context';

type Role = 'user' | 'astrologer';

export function useRoleSelect() {
  const { setProfileRole } = useAuth();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    const err = await setProfileRole(selected);
    setLoading(false);
    if (err) setError(err);
    return err;
  }

  return { selected, setSelected, loading, error, confirm };
}

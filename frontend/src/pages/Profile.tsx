import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) setName(user.name || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put('/auth/profile', { name });
      // Update user in context if needed
      alert('Profile updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded shadow">
        <h2 className="text-3xl font-bold text-center">Profile</h2>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Profile'}</Button>
        </form>
      </div>
    </div>
  );
}
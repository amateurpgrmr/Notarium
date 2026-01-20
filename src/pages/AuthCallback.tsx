// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/login?error=1');
      return;
    }

    const baseURL = import.meta.env.MODE === 'development'
      ? 'http://localhost:8787'
      : (import.meta.env.VITE_API_URL || 'https://notarium-backend.notarium-backend.workers.dev');

    fetch(`${baseURL}/api/auth/callback?code=${code}`)
      .then((res) => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('token', data.token);
        window.location.href = '/'; // Full reload to trigger Youware auth
      })
      .catch((err) => {
        console.error('Auth failed', err);
        navigate('/login?error=1');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing you in…</p>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../styles/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem('token', response.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const baseURL = import.meta.env.MODE === 'development'
      ? 'http://localhost:56533'
      : 'https://notarium-backend.notarium-backend.workers.dev';
    window.location.href = `${baseURL}/api/auth/google`;
  };

  return (
    <div className="login-container">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="login-wrapper">
        <h1 className="login-title" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          NOTARIUM
        </h1>

        <div className="login-card" style={{ animation: 'scaleIn 0.6s ease-out 0.2s both' }}>
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-subtitle">Sign in to access your study materials</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleEmailLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-button primary"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">OR</div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="login-button google"
          >
            <i className="fab fa-google"></i>
            Continue with Google
          </button>

          <p className="login-footer">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../styles/login.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    class: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.request('/api/auth/signup', {
        method: 'POST',
        body: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          class: formData.class
        }
      });

      localStorage.setItem('token', response.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <h1 className="login-title">NOTARIUM</h1>
        <div className="login-card">
          <h2 className="login-heading">Create Account</h2>
          <p className="login-subtitle">Join a library of notes</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="class">Class/Grade</label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                required
              >
                <option value="">Select your class</option>
                <option value="10.1">Grade 10.1</option>
                <option value="10.2">Grade 10.2</option>
                <option value="10.3">Grade 10.3</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-button primary"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="login-footer">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

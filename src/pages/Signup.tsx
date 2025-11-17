import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Button } from '@/components/ui/button';

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
  const [titleNumber, setTitleNumber] = useState(0);
  const navigate = useNavigate();

  const titles = useMemo(
    () => ["collaborative", "organized", "efficient", "powerful", "smart"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

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
    <div className="w-full min-h-screen flex items-center justify-center bg-black">
      <div className="container mx-auto px-4">
        <div className="flex gap-8 py-20 items-center justify-center flex-col max-w-4xl mx-auto">
          {/* Animated Hero Header */}
          <div className="flex gap-4 flex-col items-center">
            <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter text-center font-regular text-white">
              <span className="block mb-2">NOTARIUM</span>
              <span className="text-3xl md:text-5xl block">
                <span>A library that's</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-semibold text-white"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-400 max-w-2xl text-center">
              Join a library of notes
            </p>
          </div>

          {/* Signup Form Card */}
          <div className="w-full max-w-md">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-lg">
              <h2 className="text-2xl font-semibold text-center mb-6 text-white">Create Account</h2>

              {error && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-md p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-white">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="class" className="text-sm font-medium text-white">
                    Class/Grade
                  </label>
                  <select
                    id="class"
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  >
                    <option value="">Select your class</option>
                    <option value="10.1">Grade 10.1</option>
                    <option value="10.2">Grade 10.2</option>
                    <option value="10.3">Grade 10.3</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-12 overflow-hidden rounded-md group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0.5 bg-black rounded-md flex items-center justify-center">
                    <span className="relative z-10 text-white font-medium text-base">
                      {isLoading ? 'Creating account...' : 'Sign Up'}
                    </span>
                  </div>
                </button>
                <style>{`
                  @keyframes gradient-xy {
                    0%, 100% {
                      background-position: 0% 50%;
                    }
                    50% {
                      background-position: 100% 50%;
                    }
                  }
                  .animate-gradient-xy {
                    background-size: 200% 200%;
                    animation: gradient-xy 3s ease infinite;
                  }
                `}</style>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <a href="/login" className="text-white hover:underline font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

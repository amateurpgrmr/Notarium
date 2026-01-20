import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Button } from '@/components/ui/button';
import { ShaderAnimation } from '@/components/ui/shader-animation';

const SECRET_CODE = '%62rdn2%';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [titleNumber, setTitleNumber] = useState(0);

  // Forgot Password Modal States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'code' | 'reset'>('code');
  const [resetCode, setResetCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Auto-redirect if already authenticated or auto-login if token exists
  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    // Try to auto-login if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists, redirect to home - the app will validate the token
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('loginEmail');
    const savedPassword = localStorage.getItem('loginPassword');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  // Handle autofill from password reset
  useEffect(() => {
    const state = location.state as any;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    if (state?.message) {
      setSuccessMessage(state.message);
    }
  }, [location.state]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Save credentials for auto-fill on next visit
      localStorage.setItem('loginEmail', email);
      localStorage.setItem('loginPassword', password);

      const response = await api.auth.login({ email, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
        navigate('/', { replace: true });
      }

    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
    setResetStep('code');
    setResetCode('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('code');
    setResetCode('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (resetCode === SECRET_CODE) {
      setResetStep('reset');
    } else {
      setResetError('Invalid code. Please contact an admin for the correct code.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }

    if (!newPassword) {
      setResetError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    try {
      setResetLoading(true);
      await api.request('/api/auth/admin-reset-password', {
        method: 'POST',
        body: {
          email: resetEmail,
          newPassword
        }
      });

      // Success - close modal and show success message
      handleCloseForgotPassword();
      setEmail(resetEmail);
      setPassword(newPassword);
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please check your email and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Shader Animation Background */}
      <div className="absolute inset-0 z-0">
        <ShaderAnimation />
      </div>

      <div className="container mx-auto px-4 relative z-10 max-h-screen overflow-y-auto">
        <div className="flex gap-4 py-8 items-center justify-center flex-col max-w-4xl mx-auto">
          {/* Animated Hero Header */}
          <div className="flex gap-2 flex-col items-center">
            <h1 className="text-4xl md:text-5xl max-w-3xl tracking-tighter text-center font-regular text-white">
              <span className="block mb-1">NOTARIUM</span>
              <span className="text-2xl md:text-3xl block">
                <span>A library that's</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-2 md:pt-1">
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

            <p className="text-sm md:text-base leading-relaxed tracking-tight text-gray-400 max-w-2xl text-center">
              Sign in to access your study materials
            </p>
          </div>

          {/* Login Form Card */}
          <div className="w-full max-w-md">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-center mb-4 text-white">Welcome Back</h2>

              {error && (
                <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-md p-3 mb-4 text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-md p-3 mb-4 text-sm">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium text-white">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full h-12 overflow-hidden rounded-md group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0.5 bg-black rounded-md flex items-center justify-center">
                    <span className="relative z-10 text-white font-medium text-base">
                      {isLoading ? 'Signing in...' : 'Sign In'}
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

              {/* Forgot Password Link */}
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-3">
                Don't have an account?{' '}
                <a href="/signup" className="text-white hover:underline font-medium">
                  Sign up
                </a>
              </p>

              <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
                <a
                  href="/admin-login"
                  className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>🔐</span>
                  <span>Admin Sign In</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-5"
          onClick={handleCloseForgotPassword}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">Reset Password</h2>
              <button
                onClick={handleCloseForgotPassword}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <p className="text-gray-400 mb-6">
              {resetStep === 'code'
                ? 'Enter the code provided by your admin'
                : 'Enter your email and new password'
              }
            </p>

            {resetError && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-md p-3 mb-4 text-sm">
                {resetError}
              </div>
            )}

            {/* Step 1: Code Entry */}
            {resetStep === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="resetCode" className="text-sm font-medium text-white">
                    Admin Code
                  </label>
                  <input
                    id="resetCode"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter the code from admin"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="relative w-full h-12 overflow-hidden rounded-md group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0.5 bg-black rounded-md flex items-center justify-center">
                    <span className="relative z-10 text-white font-medium text-base">
                      Continue
                    </span>
                  </div>
                </button>
              </form>
            )}

            {/* Step 2: Password Reset */}
            {resetStep === 'reset' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="resetEmail" className="text-sm font-medium text-white">
                    Email
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-white">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 pr-10 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 pr-10 border border-zinc-700 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetStep('code')}
                    className="flex-1 h-12 bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 rounded-md transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="relative flex-[2] h-12 overflow-hidden rounded-md group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute inset-0.5 bg-black rounded-md flex items-center justify-center">
                      <span className="relative z-10 text-white font-medium text-base">
                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                      </span>
                    </div>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

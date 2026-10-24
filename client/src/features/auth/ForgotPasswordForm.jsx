import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from './useAuth.js';
import { Input } from '../../components/Input.jsx';
import { Button } from '../../components/Button.jsx';
import { Alert } from '../../components/Alert.jsx';

export const ForgotPasswordForm = () => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Please provide a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      await requestPasswordReset(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send password reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-brand-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Check Your Inbox</h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          If an account exists for <span className="font-semibold text-slate-800">{email}</span>, you will receive an email containing a link to reset your password.
        </p>
        <div className="pt-2">
          <Link to="/login">
            <Button variant="outline" size="sm" leftIcon={ArrowLeft}>
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert type="error" title="Request Failed">
          {error}
        </Alert>
      )}

      <div>
        <Input
          label="Email Address"
          id="forgot-email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          helperText="We'll send you a secure link to reset your password."
          required
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoading}
        leftIcon={Send}
      >
        Send Reset Link
      </Button>

      <div className="text-center pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  );
};

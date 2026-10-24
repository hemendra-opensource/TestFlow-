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
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Recovery Email Sent</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          If an account exists for <span className="font-semibold text-slate-900">{email}</span>, you will receive a secure recovery link.
        </p>
        <div className="pt-2">
          <Link to="/login">
            <Button variant="outline" size="sm" leftIcon={ArrowLeft} className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert type="error" title="Request Failed">
          {error}
        </Alert>
      )}

      <div>
        <Input
          label="Account Email Address"
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
          helperText="We'll send a password reset link to this address."
          required
        />
      </div>

      <div className="pt-1">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-11"
          isLoading={isLoading}
          leftIcon={Send}
        >
          Send Recovery Link
        </Button>
      </div>
    </form>
  );
};

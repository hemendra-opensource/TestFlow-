import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from './useAuth.js';
import { Input } from '../../components/Input.jsx';
import { Button } from '../../components/Button.jsx';
import { Alert } from '../../components/Alert.jsx';

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(password);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-emerald-950">Password Reset Successful</h3>
        <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
          Your password has been successfully updated. You can now use your new password to sign in.
        </p>
        <div className="pt-2">
          <Link to="/login">
            <Button variant="primary" size="sm">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert type="error" title="Password Reset Failed">
          {error}
        </Alert>
      )}

      <div>
        <Input
          label="New Password"
          id="reset-password"
          type="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          leftIcon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>

      <div>
        <Input
          label="Confirm New Password"
          id="reset-confirm-password"
          type="password"
          placeholder="Repeat new password"
          autoComplete="new-password"
          leftIcon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          leftIcon={KeyRound}
        >
          Update Password
        </Button>
      </div>

      <div className="text-center pt-2">
        <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-brand-600 hover:underline">
          Return to Sign In
        </Link>
      </div>
    </form>
  );
};

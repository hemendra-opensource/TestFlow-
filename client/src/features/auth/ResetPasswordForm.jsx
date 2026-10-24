import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from './useAuth.js';
import { PasswordInput } from '../../components/PasswordInput.jsx';
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
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-center space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-emerald-950">Password Updated</h3>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Your account password has been updated securely. You can now use your new password to sign in.
        </p>
        <div className="pt-2">
          <Link to="/login">
            <Button variant="primary" size="sm" className="w-full">
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
        <PasswordInput
          label="New Password"
          id="reset-password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          required
        />
      </div>

      <div>
        <PasswordInput
          label="Confirm New Password"
          id="reset-confirm-password"
          placeholder="Repeat new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error) setError(null);
          }}
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
          leftIcon={KeyRound}
        >
          Update Password
        </Button>
      </div>
    </form>
  );
};

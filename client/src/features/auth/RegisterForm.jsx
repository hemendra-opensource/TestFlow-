import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from './useAuth.js';
import { Input } from '../../components/Input.jsx';
import { PasswordInput } from '../../components/PasswordInput.jsx';
import { Button } from '../../components/Button.jsx';
import { Alert } from '../../components/Alert.jsx';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    try {
      setIsLoading(true);
      const data = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      if (data.user && !data.session) {
        setIsSuccess(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please check your details and try again.');
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
        <h3 className="text-sm font-bold text-emerald-950">Registration Successful</h3>
        <p className="text-xs text-emerald-800 leading-relaxed">
          We have sent a verification email to <span className="font-semibold text-emerald-950">{email}</span>.
          Please verify your email address to access your workspaces.
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
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {formError && (
        <Alert type="error" title="Registration Failed">
          {formError}
        </Alert>
      )}

      <div>
        <Input
          label="Full Name"
          id="register-fullname"
          placeholder="e.g. Alex Morgan"
          autoComplete="name"
          leftIcon={User}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
          }}
          error={errors.fullName}
          required
        />
      </div>

      <div>
        <Input
          label="Work Email"
          id="register-email"
          type="email"
          placeholder="name@company.com"
          autoComplete="email"
          leftIcon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          error={errors.email}
          required
        />
      </div>

      <div>
        <PasswordInput
          label="Password"
          id="register-password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          error={errors.password}
          required
        />
      </div>

      <div>
        <PasswordInput
          label="Confirm Password"
          id="register-confirm-password"
          placeholder="Repeat password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
          }}
          error={errors.confirmPassword}
          required
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full h-11"
          isLoading={isLoading}
          leftIcon={UserPlus}
        >
          Create Free Account
        </Button>
      </div>
    </form>
  );
};

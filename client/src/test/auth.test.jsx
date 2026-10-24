import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../features/auth/LoginForm.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';
import { AuthProvider } from '../features/auth/AuthContext.jsx';

// Mock Supabase client
vi.mock('../lib/supabase.js', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockRejectedValue(new Error('Invalid email or password')),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' }, session: null } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe('Frontend Authentication Flow & States', () => {
  it('displays inline validation errors when submitting empty login form', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    const form = container.querySelector('form');
    fireEvent.submit(form);

    expect(await screen.findByText(/email address is required/i)).toBeTruthy();
    expect(screen.getByText(/password is required/i)).toBeTruthy();
  });

  it('displays error alert state when Supabase sign-in fails', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in to teamflow/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/sign in failed/i)).toBeTruthy();
    expect(screen.getByText(/invalid email or password/i)).toBeTruthy();
  });

  it('validates password mismatch on registration form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterForm />
        </AuthProvider>
      </BrowserRouter>
    );

    const fullNameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Alex Morgan' } });
    fireEvent.change(emailInput, { target: { value: 'alex@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'mismatch456' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/passwords do not match/i)).toBeTruthy();
  });
});

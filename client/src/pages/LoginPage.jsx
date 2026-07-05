import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'instructor') return '/instructor';
  return '/student';
};

const LoginPage = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const loggedIn = await login(data.email.trim(), data.password);
      toast.success(`Welcome back, ${loggedIn.name}!`);
      navigate(getDashboardPath(loggedIn.role));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-sage-100 bg-white p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold text-sage-900">Welcome</h1>
        <p className="mt-2 text-sm text-sage-500">
          Sign in to manage bookings and schedules
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">
              Email
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email',
                },
              })}
              className="w-full rounded-xl border border-sage-200 px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
              placeholder="you@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sage-700">
              Password
            </label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
              className="w-full rounded-xl border border-sage-200 px-4 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-600 py-3 text-sm font-semibold text-white hover:bg-sage-700 disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            Sign In
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-8 rounded-xl bg-sage-50 p-4 text-xs text-sage-600">
            <p className="font-semibold text-sage-700">First time?</p>
            <p className="mt-1">Use the admin account from your server console on first startup.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

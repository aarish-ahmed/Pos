import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Sparkles, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getDefaultPath } from '../config/permissions';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pos.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={getDefaultPath(user.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      toast.success('Welcome back!');
      navigate(getDefaultPath(loggedIn.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-80" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-300/25 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 items-center justify-center mb-4 shadow-glow ring-4 ring-white/50">
            <Sparkles className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            Bistro POS
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Your colorful restaurant command center</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5 border border-sage-100">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full text-base py-3" disabled={submitting}>
            <LogIn className="w-5 h-5" />
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6 font-medium">
          Demo: <span className="text-brand-600">admin@pos.com</span> / admin123
        </p>
      </div>
    </div>
  );
}

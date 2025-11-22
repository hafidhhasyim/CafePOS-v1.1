
import React, { useState } from 'react';
import { Lock, Coffee, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storageService';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.checkPassword(password)) {
      onLogin();
    } else {
      setError('Password salah. Silakan coba lagi.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">KafeKita POS</h1>
          <p className="text-blue-100">Sistem Kasir Terintegrasi</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Login Admin</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="Masukkan password..."
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                   {error}
                </p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Masuk Aplikasi <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">Default Password: admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

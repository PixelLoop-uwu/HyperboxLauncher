import { motion } from 'framer-motion';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineLockClosed, HiOutlineMail } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/store/useAuthStore';


export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const { isLoading, error, clearError, user, hasTriedConfigAuth } = useAuthStore();

  const navigate = useNavigate();

  const [form, setForm] = useState({
    login_identifier: "",
    password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    const autoAuth = async () => {
      await login({}, true);
    };
    
    if (!hasTriedConfigAuth) autoAuth();
  }, [login, hasTriedConfigAuth]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (error) clearError();

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !form.login_identifier.trim() || !form.password.trim()) return;
    
    await login({ 
      username: form.login_identifier, 
      password: form.password 
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        staggerChildren: 0.1, 
        duration: 0.4 
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div 
        className="w-75 max-w-sm z-10 p-4 rounded-xl mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="w-22 h-22 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              className="h-15 w-15 brightness-0 invert opacity-70" 
              alt="HyperDrive Logo" 
            />
          </div>
          <h1 className="text-2xl font-medium text-zinc-200 tracking-tight">
            С возвращением
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">
            Войдите в свой аккаунт HyperDrive
          </p>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative group">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
              <input
                id="login_identifier"
                type="text"
                name="login_identifier"
                value={form.login_identifier}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="name@example.com"
                className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-md pl-9 pr-4 py-2 text-sm 
                           text-zinc-200 placeholder-zinc-600 outline-none 
                           focus:border-zinc-700 focus:bg-zinc-900/80 
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative group">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full bg-zinc-900/40 border border-zinc-800/60 rounded-md pl-9 pr-10 py-2 text-sm 
                           text-zinc-200 placeholder-zinc-600 outline-none 
                           focus:border-zinc-700 focus:bg-zinc-900/80 
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none disabled:opacity-50"
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="w-4 h-4" />
                ) : (
                  <HiOutlineEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2 px-4 bg-zinc-200 hover:bg-zinc-100 text-zinc-950 text-sm font-medium 
                       rounded-md transition-all duration-200 active:scale-[0.98] 
                       disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 outline-none"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-zinc-800 border-t-zinc-950 rounded-full"
                />
                Вход...
              </>
            ) : (
              "Войти"
            )}
          </button>
          
          <div className="h-2">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-red-400/80 text-center font-mono tracking-wider"
              >
                {error}
              </motion.div>
            )}
          </div>

        </motion.form>
      </motion.div>
    </div>
  );
}
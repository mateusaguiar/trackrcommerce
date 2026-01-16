import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
    outline: 'bg-transparent border border-zinc-700 hover:border-indigo-500 text-zinc-300 hover:text-white',
  };
  return (
    <button 
      className={`px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

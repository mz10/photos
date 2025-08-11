import React, { useState } from 'react';
import { api } from './api.ts';
import type { User } from './types.ts';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login = ({ onLoginSuccess }: LoginProps) => {
  const [name, setName] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !password) {
        setError('Vyplňte prosím jméno i heslo.');
        return;
    }
    try {
      const user = await api.login(name, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Nesprávné jméno nebo heslo.');
      }
    } catch (err: any) {
      setError(err.message || 'Došlo k chybě při přihlašování.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Přihlášení</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="name">Jméno</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
        </div>
        <div className="form-group">
          <label htmlFor="password">Heslo</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Přihlásit se</button>
      </form>
    </div>
  );
};
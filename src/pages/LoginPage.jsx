import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { validateLoginForm, validateRegisterForm } from '../utils/validators';
import { ROLES } from '../utils/constants';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ identifier: '', password: '', username: '', full_name: '', email: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = mode === 'login' ? validateLoginForm(formData) : validateRegisterForm(formData);
    const { valid, errors: newErrors } = result;
    
    if (!valid) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    try {
      if (mode === 'register') {
        await register(formData);
        setMode('login');
        setFormData({ ...formData, identifier: formData.username, password: '', confirmPassword: '' });
        showSuccess('Account created. You can now log in.');
        return;
      }
      const user = await login(formData.identifier, formData.password);
      showSuccess('Login successful');
      if (user.role === ROLES.MANAGER) {
        navigate('/dashboard');
      } else {
        navigate('/tickets');
      }
    } catch (err) {
      showError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{mode === 'login' ? 'Login to CMS' : 'Create your account'}</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          {mode === 'login' ? 'Track and manage your customer complaints.' : 'Register as a customer to submit complaints.'}
        </p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && <>
            <div className="form-group"><label>Full name</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} autoComplete="name" />{errors.full_name && <span className="form-error">{errors.full_name}</span>}</div>
            <div className="form-group"><label>Username</label><input type="text" name="username" value={formData.username} onChange={handleChange} autoComplete="username" />{errors.username && <span className="form-error">{errors.username}</span>}</div>
            <div className="form-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" />{errors.email && <span className="form-error">{errors.email}</span>}</div>
          </>}
          {mode === 'login' && <div className="form-group">
            <label>Email or Username</label>
            <input type="text" name="identifier" value={formData.identifier} onChange={handleChange} autoComplete="username" placeholder="Enter your email or username" />
            {errors.identifier && <span className="form-error">{errors.identifier}</span>}
          </div>}
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          {mode === 'register' && <div className="form-group">
            <label>Confirm password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
          </div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}>
          {mode === 'login' ? 'Need an account? Register' : 'Already registered? Login'}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { login } from '../services/api';
import { loginSuccess } from '../store/authSlice';
import { useNotification } from '../context/NotificationContext';
import AuthBackground from '../components/AuthBackground';
import { AlertIcon } from '../components/ui/Icons';
import './Login.scss';

/**
 * Login Page Component
 * Allows users to authenticate with their email and password.
 */
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Handles the form submission.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Manual Validation
    const errors = {};
    if (!email) errors.email = t('login.email') + ' is required'; // Or specific translation key
    if (!password) errors.password = t('login.password') + ' is required';

    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });
      // Assuming the response contains the token and user info
      const { token, id, display_name, avatar } = response.data;

      // Dispatch login success action
      dispatch(loginSuccess({
        token,
        user: { id, displayName: display_name, email, avatar }
      }));

      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      addNotification({
        kind: 'error',
        title: t('login.title'),
        subtitle: t('login.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <AuthBackground />
      <div className="auth-card login-card">
        <div className="auth-card-head">
          <h2>{t('login.title')}</h2>
          <p className="auth-card-sub">{t('login.subtitle', 'Welcome back')}</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {Object.keys(formErrors).length > 0 && (
            <div className="form-alert">
              <AlertIcon size={16} />
              <span>{t('login.fill_required', 'Please fill in all required fields')}</span>
            </div>
          )}

          <div className={`field ${formErrors.email ? 'field-invalid' : ''}`}>
            <label className="field-label" htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors({...formErrors, email: ''});
              }}
              placeholder="user@example.com"
            />
            {formErrors.email && <span className="field-error">{formErrors.email}</span>}
          </div>

          <div className={`field ${formErrors.password ? 'field-invalid' : ''}`}>
            <label className="field-label" htmlFor="password">{t('login.password')}</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors({...formErrors, password: ''});
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {formErrors.password && <span className="field-error">{formErrors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : t('login.submit')}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/register" className="register-link">
            {t('login.register_link')}
          </Link>
          <Link to="/" className="back-home-link">
            {t('login.back_to_home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

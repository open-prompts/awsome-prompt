import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { TextInput, PasswordInput, Button, Form, InlineNotification } from '@carbon/react';
import { register } from '../services/api';
import { loginSuccess } from '../store/authSlice';
import './Register.scss';

/**
 * Register Page Component
 * Allows new users to create an account.
 */
const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    id: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate password complexity
  const validatePassword = (pwd) => {
    if (pwd.length <= 8) return false;
    let complexity = 0;
    if (/[a-z]/.test(pwd)) complexity++;
    if (/[A-Z]/.test(pwd)) complexity++;
    if (/[0-9]/.test(pwd)) complexity++;
    return complexity >= 2;
  };

  /**
   * Handles input changes.
   * @param {Event} e - The input change event.
   */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error when user types
    if (formErrors[id]) {
        setFormErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  /**
   * Handles the form submission.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    
    const errors = {};
    if (!formData.id) errors.id = t('register.id') + ' is required';
    if (!formData.email) errors.email = t('register.email') + ' is required';
    if (!formData.password) errors.password = t('register.password') + ' is required';
    
    // Check password validity only if it exists
    if (formData.password && !validatePassword(formData.password)) {
      errors.password = t('register.password_error');
    }

    if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
    }

    setLoading(true);

    try {
      const response = await register(formData);
      // Assuming the response contains the token and user info
      const { token, id } = response.data;

      // Dispatch login success action
      // Note: Register response might not return displayName, rely on form data
      dispatch(loginSuccess({
        token,
        user: { id, email: formData.email, displayName: formData.displayName }
      }));

      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-form-container">
        <h2>{t('register.title')}</h2>
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            lowContrast
            hideCloseButton
          />
        )}
        <Form onSubmit={handleSubmit} noValidate>
          <TextInput
            id="id"
            labelText={t('register.id')}
            value={formData.id}
            onChange={handleChange}
            placeholder="unique_username"
            invalid={!!formErrors.id}
            invalidText={formErrors.id}
          />
          <TextInput
            id="email"
            labelText={t('register.email')}
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            invalid={!!formErrors.email}
            invalidText={formErrors.email}
          />
          <TextInput
            id="displayName"
            labelText={t('register.display_name')}
            value={formData.displayName}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
          <PasswordInput
            id="password"
            labelText={t('register.password')}
            value={formData.password}
            onChange={handleChange}
            invalid={!!formErrors.password}
            invalidText={formErrors.password}
          />
          <Button
            type="submit"
            className="register-button"
            disabled={loading}
            isSelected={loading}
          >
            {loading ? 'Registering...' : t('register.submit')}
          </Button>
        </Form>
        <Link to="/login" className="login-link">
          {t('register.login_link')}
        </Link>
      </div>
    </div>
  );
};

export default Register;

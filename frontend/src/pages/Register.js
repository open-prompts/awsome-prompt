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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  /**
   * Handles the form submission.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        <Form onSubmit={handleSubmit}>
          <TextInput
            id="id"
            labelText={t('register.id')}
            value={formData.id}
            onChange={handleChange}
            placeholder="unique_username"
            required
          />
          <TextInput
            id="email"
            labelText={t('register.email')}
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            required
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
            required
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

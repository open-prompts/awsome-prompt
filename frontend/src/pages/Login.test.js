import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import * as api from '../services/api';

// Mock the api service
jest.mock('../services/api');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('login.title')).toBeInTheDocument();
    expect(screen.getByLabelText('login.email')).toBeInTheDocument();
    expect(screen.getByLabelText('login.password')).toBeInTheDocument();
    expect(screen.getByText('login.submit')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    api.login.mockResolvedValue({
      data: {
        token: 'fake-token',
        id: 'user123',
        displayName: 'Test User',
      },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('login.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('login.password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('login.submit'));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(localStorage.getItem('token')).toBe('fake-token');
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles login failure', async () => {
    api.login.mockRejectedValue(new Error('Login failed'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('login.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('login.password'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByText('login.submit'));

    await waitFor(() => {
      expect(screen.getByText('login.error')).toBeInTheDocument();
    });
  });
});

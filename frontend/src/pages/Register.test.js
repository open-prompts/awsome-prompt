import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import Register from './Register';
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

// Helper to render with Redux
const renderWithRedux = (component) => {
  const store = configureStore({
    reducer: { auth: authReducer },
  });
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders register form', () => {
    renderWithRedux(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText('register.title')).toBeInTheDocument();
    expect(screen.getByLabelText('register.id')).toBeInTheDocument();
    expect(screen.getByLabelText('register.email')).toBeInTheDocument();
    expect(screen.getByLabelText('register.display_name')).toBeInTheDocument();
    expect(screen.getByLabelText('register.password')).toBeInTheDocument();
    expect(screen.getByText('register.submit')).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    api.register.mockResolvedValue({
      data: {
        token: 'fake-token',
        id: 'user123',
      },
    });

    renderWithRedux(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('register.id'), {
      target: { value: 'user123' },
    });
    fireEvent.change(screen.getByLabelText('register.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('register.display_name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('register.password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('register.submit'));

    await waitFor(() => {
      expect(api.register).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        password: 'password123',
      });
    });
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });

  test('handles registration failure', async () => {
    api.register.mockRejectedValue(new Error('Registration failed'));

    renderWithRedux(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('register.id'), {
      target: { value: 'user123' },
    });
    fireEvent.change(screen.getByLabelText('register.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('register.display_name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('register.password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('register.submit'));

    await waitFor(() => {
      expect(screen.getByText('register.error')).toBeInTheDocument();
    });
  });
});

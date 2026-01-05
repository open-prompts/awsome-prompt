import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

test('renders header with logo and navigation', () => {
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
  
  const logoElement = screen.getByText(/Awsome Prompt/i);
  expect(logoElement).toBeInTheDocument();

  const homeLink = screen.getByText(/Home/i);
  expect(homeLink).toBeInTheDocument();
});

test('renders login and register buttons when not logged in', () => {
  render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );

  const loginButton = screen.getByText(/Login/i);
  expect(loginButton).toBeInTheDocument();

  const registerButton = screen.getByText(/Register/i);
  expect(registerButton).toBeInTheDocument();
});

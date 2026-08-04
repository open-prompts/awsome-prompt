import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import authReducer from '../store/authSlice';

// Mock child components to avoid complexity
jest.mock('./Header', () => () => <div data-testid="header">Header</div>);
jest.mock('./Sidebar', () => () => <div data-testid="sidebar">Sidebar</div>);
jest.mock('./CreateTemplateModal', () => ({ open }) => open ? <div data-testid="create-modal">Modal Open</div> : null);

// Mock i18n so translations resolve to their keys
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

const renderWithRedux = (component, { initialState } = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: initialState,
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('Layout Component', () => {
  test('renders basic layout structure', () => {
    renderWithRedux(<Layout>Content</Layout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('does not show floating button when not authenticated', () => {
    renderWithRedux(<Layout>Content</Layout>, {
      initialState: { auth: { isAuthenticated: false } }
    });
    expect(screen.queryByTitle('header.create_template')).not.toBeInTheDocument();
  });

  test('shows floating button when authenticated', () => {
    renderWithRedux(<Layout>Content</Layout>, {
      initialState: { auth: { isAuthenticated: true, user: { id: '1' } } }
    });
    expect(screen.getByTitle('header.create_template')).toBeInTheDocument();
  });

  test('opens modal when clicking floating button', () => {
    renderWithRedux(<Layout>Content</Layout>, {
      initialState: { auth: { isAuthenticated: true, user: { id: '1' } } }
    });

    fireEvent.click(screen.getByTitle('header.create_template'));
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });
});

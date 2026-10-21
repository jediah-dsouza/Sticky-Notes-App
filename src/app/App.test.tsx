import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';

beforeEach(() => localStorage.clear());
afterEach(() => window.history.replaceState({}, '', '/'));

describe('foundation shell', () => {
  it('preserves the workspace shell while exposing the approved composer', () => {
    render(<App />);
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'A little space for your thoughts.',
    );
    expect(screen.getByText('A fresh sheet.')).toBeVisible();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Save note' })).toBeVisible();
  });
  it('offers recovery for unknown paths', () => {
    window.history.replaceState({}, '', '/missing');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'This page is a loose leaf.',
    );
    expect(
      screen.getByRole('link', { name: /Return to workspace/ }),
    ).toHaveAttribute('href', '/');
  });
  it('puts skip navigation first in keyboard order', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole('link', { name: 'Sticky Notes App' }),
    ).toHaveFocus();
  });
});

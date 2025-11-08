import { render, screen } from '@testing-library/react';
import { makeCard } from '@poker/core-cards';
import { describe, expect, it } from 'vitest';

import { PlayingCard } from '../PlayingCard';

describe('PlayingCard', () => {
  it('renders rank and suit when the card is face up', () => {
    const card = makeCard('A', 'S', true);
    render(<PlayingCard card={card} theme="classic" />);

    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('♠').length).toBeGreaterThan(0);
  });

  it('hides the face content when the card is face down', () => {
    const card = makeCard('K', 'H', false);
    render(<PlayingCard card={card} />);

    expect(screen.queryByText('K')).toBeNull();
    expect(screen.queryByText('♥')).toBeNull();
  });

  it('marks the card as selected via data attributes', () => {
    const card = makeCard('Q', 'D', true);
    render(<PlayingCard card={card} selected onClick={() => {}} />);

    const root = screen.getByRole('button');
    expect(root.dataset.selected).toBe('true');
  });
});

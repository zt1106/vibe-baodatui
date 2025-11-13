import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { makeCard } from '@poker/core-cards';

import { CardRow } from '../CardRow';

afterEach(() => cleanup());

function createCards() {
  return ['A', 'K', 'Q', 'J', '10'].map(rank =>
    makeCard(rank as Parameters<typeof makeCard>[0], 'S', true)
  );
}

describe('CardRow', () => {
  it('initially marks defaultSelectedIds and emits selection changes in single mode', () => {
    const cards = createCards();
    const onSelectionChange = vi.fn();

    render(
      <CardRow
        cards={cards}
        selectionMode="single"
        defaultSelectedIds={[cards[0].id]}
        onSelectionChange={onSelectionChange}
      />
    );

    const options = screen.getAllByRole('option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    fireEvent.click(options[1]);
    expect(onSelectionChange).toHaveBeenLastCalledWith([cards[1].id]);
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('toggles cards in multiple selection mode', () => {
    const cards = createCards();
    const onSelectionChange = vi.fn();
    render(<CardRow cards={cards} selectionMode="multiple" onSelectionChange={onSelectionChange} />);

    const options = screen.getAllByRole('option');
    fireEvent.click(options[0]);
    expect(onSelectionChange).toHaveBeenLastCalledWith([cards[0].id]);

    fireEvent.click(options[1]);
    expect(onSelectionChange).toHaveBeenLastCalledWith([cards[0].id, cards[1].id]);

    fireEvent.click(options[0]);
    expect(onSelectionChange).toHaveBeenLastCalledWith([cards[1].id]);
  });

  it('ignores clicks on disabled cards', () => {
    const cards = createCards();
    const onSelectionChange = vi.fn();
    render(
      <CardRow
        cards={cards}
        selectionMode="single"
        disabledIds={[cards[1].id]}
        onSelectionChange={onSelectionChange}
      />
    );

    const options = screen.getAllByRole('option');
    fireEvent.click(options[1]);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

'use client';

import { CardAnimationProvider, CardRow } from '@poker/ui-cards';
import { createSampleHand } from '../../components/cards/sampleData';

export default function CardRowTestPage() {
  const cards = createSampleHand(2, 6);

  return (
    <CardAnimationProvider layoutGroupId="card-row-test-page">
      <div
        style={{
          minHeight: '100vh',
          padding: 32,
          background:
            'linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(2, 6, 23, 0.9))',
          color: '#e2e8f0'
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 24
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600 }}>
            CardRow Selection Regression Test
          </h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Click any card twice—select then deselect—to ensure it returns to the baseline layout.
          </p>
          <div style={{ padding: 24, borderRadius: 32, background: 'rgba(15, 23, 42, 0.8)' }}>
            <CardRow
              cards={cards}
              size="md"
              overlap="60%"
              angle={-15}
              curveVerticalOffset={14}
              selectionMode="multiple"
            />
          </div>
        </div>
      </div>
    </CardAnimationProvider>
  );
}

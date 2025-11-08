import type { Preview } from '@storybook/react';
import '../app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    backgrounds: {
      default: 'midnight',
      values: [
        { name: 'midnight', value: '#020617' },
        { name: 'felt', value: '#0f172a' },
        { name: 'canvas', value: '#f8fafc' }
      ]
    }
  },
  tags: ['autodocs']
};

export default preview;

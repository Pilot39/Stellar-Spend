import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleSection } from './CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Design System/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: 'boolean',
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Collapsed: Story = {
  args: {
    id: 'advanced-options',
    title: 'Advanced options',
    description: 'Fee method, routing details, and more',
    defaultOpen: false,
    children: <p className="text-sm text-[#aaaaaa]">Hidden content goes here.</p>,
  },
};

export const Expanded: Story = {
  args: {
    id: 'advanced-options-open',
    title: 'Advanced options',
    description: 'Fee method, routing details, and more',
    defaultOpen: true,
    children: <p className="text-sm text-[#aaaaaa]">Visible content goes here.</p>,
  },
};

export const WithoutDescription: Story = {
  args: {
    id: 'no-description',
    title: 'Transaction details',
    defaultOpen: true,
    children: <p className="text-sm text-[#aaaaaa]">Content without a description line.</p>,
  },
};

export const WithoutDescriptionCollapsed: Story = {
  args: {
    id: 'no-description-collapsed',
    title: 'Transaction details',
    defaultOpen: false,
    children: <p className="text-sm text-[#aaaaaa]">Content without a description line.</p>,
  },
};

export const WithRichContent: Story = {
  args: {
    id: 'rich-content',
    title: 'Routing details',
    description: 'Configure how the transaction is routed',
    defaultOpen: true,
    children: (
      <div className="space-y-2">
        <label className="block text-sm text-[#aaaaaa]" htmlFor="route-input">
          Route
        </label>
        <input
          id="route-input"
          type="text"
          defaultValue="direct"
          className="w-full rounded border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white"
        />
        <p className="text-xs text-[#666666]">Changes apply immediately.</p>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    id: 'long-title',
    title: 'Advanced options for fee method, routing details, and additional configuration',
    description: 'A longer title to verify wrapping behavior in the header',
    defaultOpen: false,
    children: <p className="text-sm text-[#aaaaaa]">Hidden content goes here.</p>,
  },
};
</｜｜DSML｜｜ parameter>
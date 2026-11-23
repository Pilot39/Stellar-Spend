import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Badge } from './Badge';

const VARIANTS = ['default', 'success', 'warning', 'error', 'info'] as const;

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Badge',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning Badge',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error Badge',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info Badge',
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {VARIANTS.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </Badge>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const variant of VARIANTS) {
      const label = variant.charAt(0).toUpperCase() + variant.slice(1);
      const badge = canvas.getByText(label);
      await expect(badge).toBeInTheDocument();
      await expect(badge).toHaveTextContent(label);
    }
  },
};

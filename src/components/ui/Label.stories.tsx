import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'UI Primitives/Label',
  component: Label,
  tags: ['autodocs'],
  args: {
    children: 'Amount',
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const WithHtmlFor: Story = {
  args: {
    htmlFor: 'amount-input',
    children: 'Currency',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(/currency/i);

    await expect(label).toBeInTheDocument();
    await expect(label.tagName).toBe('LABEL');
    await expect(label).toHaveAttribute('for', 'amount-input');
  },
};

export const LongText: Story = {
  args: {
    children: 'Beneficiary account identifier',
  },
};

export const AccessibilityTest: Story = {
  args: {
    htmlFor: 'recipient-id',
    children: 'Recipient Bank ID',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(/recipient bank id/i);

    // Verify label structure for accessibility
    await expect(label).toBeInTheDocument();
    await expect(label.tagName).toBe('LABEL');
    await expect(label).toHaveAttribute('for', 'recipient-id');
  },
};

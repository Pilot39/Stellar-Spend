import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Design System/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    title: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational alert.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success!',
    children: 'Your action was completed successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please be careful with this action.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'Something went wrong. Please try again.',
  },
};

export const NoTitle: Story = {
  args: {
    variant: 'info',
    children: 'This is an alert without a title.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const content = canvas.getByText(/this is an alert without a title/i);
    await expect(content).toBeInTheDocument();
  },
};

export const TitleOnly: Story = {
  args: {
    variant: 'warning',
    title: 'Title Only Alert',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = canvas.getByText(/title only alert/i);
    await expect(title).toBeInTheDocument();
  },
};

export const Interactive: Story = {
  args: {
    variant: 'success',
    title: 'Alert Rendered',
    children: 'This is an interactive alert demonstration.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test alert title is rendered
    const title = canvas.getByText(/alert rendered/i);
    await expect(title).toBeInTheDocument();

    // Test alert body/content is rendered
    const content = canvas.getByText(/this is an interactive alert/i);
    await expect(content).toBeInTheDocument();
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Alert {...args} variant="info" title="Info" children="Informational message." />
      <Alert {...args} variant="success" title="Success" children="Success message." />
      <Alert {...args} variant="warning" title="Warning" children="Warning message." />
      <Alert {...args} variant="error" title="Error" children="Error message." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/informational message/i)).toBeInTheDocument();
    await expect(canvas.getByText(/success message/i)).toBeInTheDocument();
    await expect(canvas.getByText(/warning message/i)).toBeInTheDocument();
    await expect(canvas.getByText(/error message/i)).toBeInTheDocument();
  },
};

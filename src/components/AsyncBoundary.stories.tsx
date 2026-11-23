import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AsyncBoundary, ListLoadingState, ListEmptyState, ListErrorState } from './AsyncBoundary';

const meta = {
  title: 'Components/AsyncBoundary',
  component: AsyncBoundary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Unified async boundary. Handles loading, empty and error states for async content, ' +
          'and catches render errors thrown by its children via the shared ErrorBoundary.',
      },
    },
  },
} satisfies Meta<typeof AsyncBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content component
function SampleList() {
  return (
    <div className="border border-[#333333] bg-[#111111] rounded">
      <div className="px-4 py-3 border-b border-[#333333]">
        <h3 className="text-sm font-semibold text-white">Items</h3>
      </div>
      <ul className="divide-y divide-[#222222]">
        {[1, 2, 3].map((i) => (
          <li key={i} className="px-4 py-3 text-sm text-[#aaaaaa]">
            Item {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Loaded: Story = {
  args: {
    isLoading: false,
    isEmpty: false,
    children: <SampleList />,
  },
};

export const LoadingState: Story = {
  args: {
    isLoading: true,
    isEmpty: false,
    loadingContent: <ListLoadingState rows={3} />,
    children: <SampleList />,
  },
};

export const EmptyState: Story = {
  args: {
    isLoading: false,
    isEmpty: true,
    emptyContent: (
      <ListEmptyState
        title="No transactions"
        description="Connect your wallet to view your transactions"
        action={
          <button className="px-4 py-2 bg-[#c9a962] text-[#0a0a0a] text-xs font-semibold rounded hover:bg-[#dbb76d] transition-colors">
            Connect Wallet
          </button>
        }
      />
    ),
    children: <SampleList />,
  },
};

export const ErrorState: Story = {
  args: {
    isLoading: false,
    isEmpty: false,
    error: 'Failed to fetch transactions. Please try again.',
    errorContent: (error) => <ListErrorState error={error} onRetry={() => alert('Retrying...')} />,
    children: <SampleList />,
  },
};

export const ErrorStateWithDefaultFallback: Story = {
  args: {
    isLoading: false,
    isEmpty: false,
    error: 'Failed to fetch transactions. Please try again.',
    children: <SampleList />,
  },
};

function ThrowingChild(): React.ReactElement {
  throw new Error('Unexpected render failure');
}

export const CaughtRenderError: Story = {
  args: {
    isLoading: false,
    isEmpty: false,
    children: <ThrowingChild />,
  },
};

export const CaughtRenderErrorWithCustomFallback: Story = {
  args: {
    isLoading: false,
    isEmpty: false,
    errorContent: (error) => <ListErrorState error={error} onRetry={() => alert('Retrying...')} />,
    children: <ThrowingChild />,
  },
};

// --- ListLoadingState stories ---

const loadingMeta = {
  title: 'Components/AsyncBoundary/ListLoadingState',
  component: ListLoadingState,
  tags: ['autodocs'],
} satisfies Meta<typeof ListLoadingState>;

type LoadingStory = StoryObj<typeof loadingMeta>;

export const ListLoading: LoadingStory = {
  render: (args) => <ListLoadingState {...args} />,
  args: {
    rows: 5,
  },
};

// --- ListEmptyState stories ---

const emptyMeta = {
  title: 'Components/AsyncBoundary/ListEmptyState',
  component: ListEmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof ListEmptyState>;

type EmptyStory = StoryObj<typeof emptyMeta>;

export const ListEmpty: EmptyStory = {
  render: (args) => <ListEmptyState {...args} />,
  args: {
    title: 'No items found',
    description: 'Try adjusting your filters or create a new item',
  },
};

export const ListEmptyWithAction: EmptyStory = {
  render: (args) => <ListEmptyState {...args} />,
  args: {
    title: 'No notifications yet',
    description: 'You will see updates about your transactions here',
    action: (
      <button className="px-4 py-2 bg-[#c9a962] text-[#0a0a0a] text-xs font-semibold rounded">
        Enable Notifications
      </button>
    ),
  },
};

// --- ListErrorState stories ---

const errorMeta = {
  title: 'Components/AsyncBoundary/ListErrorState',
  component: ListErrorState,
  tags: ['autodocs'],
} satisfies Meta<typeof ListErrorState>;

type ErrorStory = StoryObj<typeof errorMeta>;

export const ListError: ErrorStory = {
  render: (args) => <ListErrorState {...args} />,
  args: {
    error: 'Failed to load data',
  },
};

export const ListErrorWithRetry: ErrorStory = {
  render: (args) => <ListErrorState {...args} />,
  args: {
    error: 'Connection timeout. Please check your internet and try again.',
    onRetry: () => {},
  },
};

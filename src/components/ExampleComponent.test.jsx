import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

/**
 * Example test file template
 *
 * This shows best practices for testing React components with Vitest.
 * Copy and modify for your components.
 */

// Simple example component for testing
function Counter({ initialCount = 0, onIncrement }) {
  const [count, setCount] = React.useState(initialCount);

  const handleClick = () => {
    setCount(count + 1);
    onIncrement?.(count + 1);
  };

  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

// ============================================
// TESTS
// ============================================

describe('Counter Component', () => {
  it('renders with initial count', () => {
    render(<Counter initialCount={5} />);

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 5');
  });

  it('increments count when button clicked', () => {
    render(<Counter />);

    const button = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(button);

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
  });

  it('calls onIncrement callback with new count', () => {
    const handleIncrement = vi.fn();
    render(<Counter onIncrement={handleIncrement} />);

    const button = screen.getByRole('button', { name: /increment/i });
    fireEvent.click(button);

    expect(handleIncrement).toHaveBeenCalledWith(1);
    expect(handleIncrement).toHaveBeenCalledTimes(1);
  });

  it('increments multiple times', () => {
    render(<Counter />);

    const button = screen.getByRole('button', { name: /increment/i });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 3');
  });
});

// ============================================
// TESTING PATTERNS
// ============================================

/*
// 1. Query methods (prefer in this order)
getByRole()       // Best for accessibility
getByLabelText()  // Good for form fields
getByPlaceholderText()
getByText()       // Good for non-interactive elements
getByTestId()     // Last resort

// 2. Async queries (for loading states)
await findByText('Loaded')
await waitFor(() => expect(...))

// 3. User interactions
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// 4. Mocking fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);

// 5. Testing with React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

render(<MyComponent />, { wrapper });

// 6. Testing with Zustand
import { useExampleStore } from './stores/exampleStore';

beforeEach(() => {
  useExampleStore.getState().clear();
});
*/

// ============================================
// RUN TESTS
// ============================================

/*
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- ExampleComponent.test.jsx
*/

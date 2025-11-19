import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoStore } from './demoStore';

/**
 * Test suite for Demo Store
 *
 * Run with: npm test
 * Watch mode: npm test -- --watch
 */

describe('DemoStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it('initializes with count of 0', () => {
    const state = useDemoStore.getState();
    expect(state.count).toBe(0);
  });

  it('has a default message', () => {
    const state = useDemoStore.getState();
    expect(state.message).toBe('Zustand is working! 🎉');
  });

  it('increments count', () => {
    const { increment, count } = useDemoStore.getState();

    increment();
    expect(useDemoStore.getState().count).toBe(1);

    increment();
    expect(useDemoStore.getState().count).toBe(2);
  });

  it('decrements count but not below 0', () => {
    const { increment, decrement } = useDemoStore.getState();

    // Increment to 2
    increment();
    increment();
    expect(useDemoStore.getState().count).toBe(2);

    // Decrement once
    decrement();
    expect(useDemoStore.getState().count).toBe(1);

    // Decrement to 0
    decrement();
    expect(useDemoStore.getState().count).toBe(0);

    // Try to go negative (should stay at 0)
    decrement();
    expect(useDemoStore.getState().count).toBe(0);
  });

  it('resets count to 0', () => {
    const { increment, reset } = useDemoStore.getState();

    increment();
    increment();
    increment();
    expect(useDemoStore.getState().count).toBe(3);

    reset();
    expect(useDemoStore.getState().count).toBe(0);
  });

  it('tracks click history', () => {
    const { increment, clicks } = useDemoStore.getState();

    expect(clicks.length).toBe(0);

    increment();
    expect(useDemoStore.getState().clicks.length).toBe(1);
    expect(useDemoStore.getState().clicks[0].count).toBe(1);

    increment();
    expect(useDemoStore.getState().clicks.length).toBe(2);
    expect(useDemoStore.getState().clicks[1].count).toBe(2);
  });

  it('clears click history on reset', () => {
    const { increment, reset } = useDemoStore.getState();

    increment();
    increment();
    expect(useDemoStore.getState().clicks.length).toBe(2);

    reset();
    expect(useDemoStore.getState().clicks.length).toBe(0);
  });

  it('updates message', () => {
    const { setMessage } = useDemoStore.getState();

    setMessage('New message');
    expect(useDemoStore.getState().message).toBe('New message');
  });

  it('toggles visibility', () => {
    const { toggleVisibility, isVisible } = useDemoStore.getState();

    expect(isVisible).toBe(true);

    toggleVisibility();
    expect(useDemoStore.getState().isVisible).toBe(false);

    toggleVisibility();
    expect(useDemoStore.getState().isVisible).toBe(true);
  });

  it('getTotal selector returns current count', () => {
    const { increment, getTotal } = useDemoStore.getState();

    expect(getTotal()).toBe(0);

    increment();
    expect(getTotal()).toBe(1);

    increment();
    increment();
    expect(getTotal()).toBe(3);
  });

  it('keeps only last 10 clicks', () => {
    const { increment } = useDemoStore.getState();

    // Click 15 times
    for (let i = 0; i < 15; i++) {
      increment();
    }

    const clicks = useDemoStore.getState().clicks;
    expect(clicks.length).toBe(10);
    expect(clicks[0].count).toBe(6); // First click is #6 (5 old ones dropped)
    expect(clicks[9].count).toBe(15); // Last click is #15
  });
});

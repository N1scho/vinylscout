/**
 * RangeSlider Component Tests
 *
 * Comprehensive tests for the RangeSlider component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RangeSlider from './RangeSlider';

describe('RangeSlider', () => {
  const mockThemes = {
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    background: '#ffffff',
    border: '#e2e8f0',
  };

  it('renders with default props', () => {
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={() => {}}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays label and values correctly', () => {
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={() => {}}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );
    expect(screen.getByText('Year')).toBeTruthy();
    // Check that the values are displayed (format depends on locale)
    const valueDisplay = container.querySelector('[style*="color: rgb(37, 99, 235)"]');
    expect(valueDisplay.textContent).toMatch(/1[.,]990.*2[.,]020/);
  });

  it('calls onChange when min value changes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={onChange}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: '1980' } });

    expect(onChange).toHaveBeenCalledWith([1980, 2020]);
  });

  it('calls onChange when max value changes', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={onChange}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    const maxInput = inputs[1];
    fireEvent.change(maxInput, { target: { value: '2010' } });

    expect(onChange).toHaveBeenCalledWith([1990, 2010]);
  });

  it('prevents min from exceeding max', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={onChange}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    const minInput = inputs[0];
    fireEvent.change(minInput, { target: { value: '2025' } });

    expect(onChange).toHaveBeenCalledWith([2020, 2020]);
  });

  it('prevents max from being less than min', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={onChange}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    const maxInput = inputs[1];
    fireEvent.change(maxInput, { target: { value: '1980' } });

    expect(onChange).toHaveBeenCalledWith([1990, 1990]);
  });

  it('displays min/max boundary labels', () => {
    render(
      <RangeSlider
        min={0}
        max={100}
        value={[25, 75]}
        onChange={() => {}}
        label="Price"
        step={5}
        themes={mockThemes}
      />
    );
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
  });

  it('respects custom step values', () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        min={0}
        max={100}
        value={[25, 75]}
        onChange={onChange}
        label="Price"
        step={5}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    expect(inputs[0].getAttribute('step')).toBe('5');
    expect(inputs[1].getAttribute('step')).toBe('5');
  });

  it('has accessible aria labels', () => {
    const { container } = render(
      <RangeSlider
        min={1960}
        max={2025}
        value={[1990, 2020]}
        onChange={() => {}}
        label="Year"
        step={1}
        themes={mockThemes}
      />
    );

    const inputs = container.querySelectorAll('input[type="range"]');
    expect(inputs[0].getAttribute('aria-label')).toBe('Year minimum value');
    expect(inputs[1].getAttribute('aria-label')).toBe('Year maximum value');
  });
});

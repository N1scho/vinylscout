import React, { useState, useCallback } from 'react';
import { designSystem } from '../designsystem';

/**
 * RangeSlider Component
 *
 * A dual-thumb range input for selecting min/max values.
 * Uses two native HTML5 range inputs for broad compatibility.
 *
 * @param {number} min - minimum allowed value
 * @param {number} max - maximum allowed value
 * @param {[number, number]} value - current selected range [minVal, maxVal]
 * @param {function} onChange - callback when range changes, receives [minVal, maxVal]
 * @param {string} label - display label (e.g., "Year", "Price ($)")
 * @param {number} step - slider step increment
 * @param {object} themes - theme colors from designSystem
 */
export default function RangeSlider({
  min,
  max,
  value = [min, max],
  onChange,
  label = 'Range',
  step = 1,
  themes
}) {
  const [minVal, maxVal] = value;

  // Handle min input change
  const handleMinChange = useCallback((e) => {
    const newMin = Math.min(Number(e.target.value), maxVal);
    onChange([newMin, maxVal]);
  }, [maxVal, onChange]);

  // Handle max input change
  const handleMaxChange = useCallback((e) => {
    const newMax = Math.max(Number(e.target.value), minVal);
    onChange([minVal, newMax]);
  }, [minVal, onChange]);

  // Calculate percentage for visual feedback (gap between thumbs)
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: designSystem.spacing.lg,
    padding: designSystem.spacing.lg,
    backgroundColor: themes?.surface || '#ffffff',
    borderRadius: designSystem.borderRadius.md,
    border: `1px solid ${themes?.border || '#e2e8f0'}`,
  };

  const labelStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: designSystem.spacing.md,
  };

  const labelTextStyle = {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: designSystem.typography.weights.medium,
    color: themes?.text || '#0f172a',
    fontFamily: designSystem.typography.fontFamily,
  };

  const valueDisplayStyle = {
    fontSize: designSystem.typography.sizes.sm,
    fontWeight: designSystem.typography.weights.semibold,
    color: themes?.primary || '#2563eb',
    fontFamily: designSystem.typography.fontFamily,
    whiteSpace: 'nowrap',
  };

  const sliderContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    marginTop: designSystem.spacing.sm,
  };

  const trackStyle = {
    position: 'absolute',
    width: '100%',
    height: '4px',
    backgroundColor: themes?.border || '#e2e8f0',
    borderRadius: '2px',
    pointerEvents: 'none',
  };

  const rangeStyle = {
    position: 'absolute',
    height: '4px',
    backgroundColor: themes?.primary || '#2563eb',
    borderRadius: '2px',
    pointerEvents: 'none',
    left: `${minPercent}%`,
    right: `${100 - maxPercent}%`,
  };

  const inputStyle = (isMin) => ({
    position: 'absolute',
    width: '100%',
    height: '40px',
    top: '0',
    left: '0',
    cursor: 'pointer',
    pointerEvents: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: 'transparent',
    zIndex: isMin && minVal > max - (max - min) * 0.05 ? 5 : 3,
  });

  // Input thumb styling via pseudo-elements requires a style tag
  const thumbStyle = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${themes?.primary || '#2563eb'};
      cursor: pointer;
      pointer-events: auto;
      border: 2px solid ${themes?.background || '#ffffff'};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: background 150ms ease, transform 150ms ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      background: ${themes?.primaryHover || '#1d4ed8'};
      transform: scale(1.1);
    }
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${themes?.primary || '#2563eb'};
      cursor: pointer;
      pointer-events: auto;
      border: 2px solid ${themes?.background || '#ffffff'};
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: background 150ms ease, transform 150ms ease;
    }
    input[type="range"]::-moz-range-thumb:hover {
      background: ${themes?.primaryHover || '#1d4ed8'};
      transform: scale(1.1);
    }
    input[type="range"]::-moz-range-track {
      background: transparent;
      border: none;
    }
  `;

  return (
    <>
      <style>{thumbStyle}</style>
      <div style={containerStyle}>
        {/* Header: Label and Value Display */}
        <div style={labelStyle}>
          <span style={labelTextStyle}>{label}</span>
          <span style={valueDisplayStyle}>
            {minVal.toLocaleString()} - {maxVal.toLocaleString()}
          </span>
        </div>

        {/* Dual Range Sliders */}
        <div style={sliderContainerStyle}>
          {/* Background track */}
          <div style={trackStyle} />

          {/* Active range highlight */}
          <div style={rangeStyle} />

          {/* Min range input */}
          <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={handleMinChange}
            step={step}
            style={inputStyle(true)}
            aria-label={`${label} minimum value`}
          />

          {/* Max range input */}
          <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={handleMaxChange}
            step={step}
            style={inputStyle(false)}
            aria-label={`${label} maximum value`}
          />
        </div>

        {/* Min/Max Labels (optional, for context) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: designSystem.spacing.sm,
            fontSize: designSystem.typography.sizes.xs,
            color: themes?.textSecondary || '#64748b',
            fontFamily: designSystem.typography.fontFamily,
          }}
        >
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </>
  );
}

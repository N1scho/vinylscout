import React from 'react';
import { Search } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * AdvancedSearch Component
 *
 * Multi-field search form for detailed Discogs queries
 */
export default function AdvancedSearch({
  values = {},
  onChange,
  onSearch,
  isLoading = false,
  themes
}) {
  const handleFieldChange = (field, value) => {
    onChange({
      ...values,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading) {
      onSearch();
    }
  };

  const fields = [
    { key: 'artist', label: 'Artist', placeholder: 'Artist name' },
    { key: 'album', label: 'Album', placeholder: 'Album title' },
    { key: 'year', label: 'Year', placeholder: 'Release year', type: 'number' },
    { key: 'label', label: 'Label', placeholder: 'Record label' },
    { key: 'genre', label: 'Genre', placeholder: 'Genre' },
    { key: 'format', label: 'Format', placeholder: 'e.g., Vinyl, CD' }
  ];

  const hasAnyValue = Object.values(values).some((v) => v && v.trim());

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: designSystem.spacing.lg,
        backgroundColor: themes?.surface || '#ffffff',
        border: `1px solid ${themes?.border || '#e2e8f0'}`,
        borderRadius: designSystem.borderRadius.md,
        marginBottom: designSystem.spacing.lg
      }}
    >
      {/* Title */}
      <div
        style={{
          marginBottom: designSystem.spacing.lg,
          paddingBottom: designSystem.spacing.md,
          borderBottom: `1px solid ${themes?.borderLight || 'rgba(0, 0, 0, 0.05)'}` }}
      >
        <h3
          style={{
            fontSize: designSystem.typography.sizes.lg,
            fontWeight: designSystem.typography.weights.semibold,
            color: themes?.text || '#0f172a',
            margin: 0
          }}
        >
          Advanced Search
        </h3>
        <p
          style={{
            fontSize: designSystem.typography.sizes.sm,
            color: themes?.textSecondary || '#64748b',
            margin: `${designSystem.spacing.xs} 0 0 0`
          }}
        >
          Fill in any combination of fields to refine your search
        </p>
      </div>

      {/* Fields Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: designSystem.spacing.md,
          marginBottom: designSystem.spacing.lg
        }}
      >
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`advanced-${field.key}`}
              style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium,
                color: themes?.textSecondary || '#64748b',
                marginBottom: designSystem.spacing.xs
              }}
            >
              {field.label}
            </label>
            <input
              id={`advanced-${field.key}`}
              type={field.type || 'text'}
              value={values[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: designSystem.spacing.sm,
                fontSize: designSystem.typography.sizes.base,
                backgroundColor: themes?.background || '#ffffff',
                color: themes?.text || '#0f172a',
                border: `1px solid ${themes?.border || '#e2e8f0'}`,
                borderRadius: designSystem.borderRadius.sm,
                outline: 'none',
                transition: designSystem.transitions.fast,
                opacity: isLoading ? 0.6 : 1
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = themes?.primary || '#2563eb';
                e.currentTarget.style.boxShadow = `0 0 0 3px ${
                  themes?.primary10 || 'rgba(37, 99, 235, 0.1)'
                }`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = themes?.border || '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: designSystem.spacing.sm,
          justifyContent: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={() => onChange({})}
          disabled={isLoading || !hasAnyValue}
          style={{
            padding: `${designSystem.spacing.sm} ${designSystem.spacing.lg}`,
            backgroundColor: 'transparent',
            color: themes?.textSecondary || '#64748b',
            border: `1px solid ${themes?.border || '#e2e8f0'}`,
            borderRadius: designSystem.borderRadius.sm,
            cursor: isLoading || !hasAnyValue ? 'not-allowed' : 'pointer',
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.medium,
            opacity: isLoading || !hasAnyValue ? 0.5 : 1,
            transition: designSystem.transitions.fast
          }}
          onMouseEnter={(e) => {
            if (!isLoading && hasAnyValue) {
              e.currentTarget.style.backgroundColor =
                themes?.hoverOverlay || 'rgba(0, 0, 0, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Clear All
        </button>

        <button
          type="submit"
          disabled={isLoading || !hasAnyValue}
          style={{
            padding: `${designSystem.spacing.sm} ${designSystem.spacing.xl}`,
            backgroundColor: themes?.primary || '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: designSystem.borderRadius.sm,
            cursor: isLoading || !hasAnyValue ? 'not-allowed' : 'pointer',
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.medium,
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.sm,
            opacity: isLoading || !hasAnyValue ? 0.6 : 1,
            transition: designSystem.transitions.fast
          }}
          onMouseEnter={(e) => {
            if (!isLoading && hasAnyValue) {
              e.currentTarget.style.backgroundColor = themes?.primaryHover || '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = themes?.primary || '#2563eb';
          }}
        >
          <Search size={16} />
          <span>Search</span>
        </button>
      </div>
    </form>
  );
}

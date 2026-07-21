import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * Pagination Component
 *
 * Handles page navigation with previous/next buttons and page numbers
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  themes
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the start
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisible);
    }

    // Adjust if we're near the end
    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }

    // Add first page and ellipsis
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: designSystem.spacing.sm,
        padding: `${designSystem.spacing.xl} 0`,
        flexWrap: 'wrap'
      }}
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: designSystem.spacing.sm,
          minWidth: designSystem.touchTarget.min,
          minHeight: designSystem.touchTarget.min,
          backgroundColor: currentPage === 1 ? themes.surfaceVariant : themes.surface,
          color: currentPage === 1 ? themes.textTertiary : themes.text,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.sm,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: designSystem.transitions.fast,
          opacity: currentPage === 1 ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (currentPage !== 1) {
            e.currentTarget.style.backgroundColor = themes.hoverOverlay;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = themes.surface;
        }}
        title="Previous page"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: `${designSystem.spacing.sm} ${designSystem.spacing.xs}`,
                color: themes.textSecondary,
                fontSize: designSystem.typography.sizes.base,
                userSelect: 'none'
              }}
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={isActive}
            style={{
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: isActive ? themes.primary : themes.surface,
              color: isActive ? '#0f0f0f' : themes.text,
              border: `1px solid ${isActive ? themes.primary : themes.border}`,
              borderRadius: '8px',
              cursor: isActive ? 'default' : 'pointer',
              fontSize: designSystem.typography.sizes.base,
              fontWeight: isActive ? 600 : 400,
              transition: designSystem.transitions.fast
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                e.currentTarget.style.borderColor = themes.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = themes.surface;
                e.currentTarget.style.borderColor = themes.border;
              }
            }}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: designSystem.spacing.sm,
          minWidth: designSystem.touchTarget.min,
          minHeight: designSystem.touchTarget.min,
          backgroundColor:
            currentPage === totalPages ? themes.surfaceVariant : themes.surface,
          color: currentPage === totalPages ? themes.textTertiary : themes.text,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.sm,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: designSystem.transitions.fast,
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (currentPage !== totalPages) {
            e.currentTarget.style.backgroundColor = themes.hoverOverlay;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = themes.surface;
        }}
        title="Next page"
      >
        <ChevronRight size={20} />
      </button>

      {/* Page Info */}
      <div
        style={{
          marginLeft: designSystem.spacing.md,
          padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
          fontSize: designSystem.typography.sizes.sm,
          color: themes.textSecondary,
          backgroundColor: themes.surface,
          border: `1px solid ${themes.borderLight}`,
          borderRadius: designSystem.borderRadius.sm
        }}
      >
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

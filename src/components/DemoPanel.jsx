import React from 'react';
import { useDemoStore } from '../stores/demoStore';
import { X, Plus, Minus, RotateCcw, Code } from 'lucide-react';

/**
 * Demo Panel - Shows Zustand in action!
 *
 * This is a floating panel that demonstrates:
 * - Zustand state management
 * - Persistent storage (survives page reload)
 * - Selective re-renders (only updates when needed)
 */

export default function DemoPanel() {
  const count = useDemoStore((state) => state.count);
  const message = useDemoStore((state) => state.message);
  const clicks = useDemoStore((state) => state.clicks);
  const isVisible = useDemoStore((state) => state.isVisible);
  const increment = useDemoStore((state) => state.increment);
  const decrement = useDemoStore((state) => state.decrement);
  const reset = useDemoStore((state) => state.reset);
  const toggleVisibility = useDemoStore((state) => state.toggleVisibility);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        <Code size={24} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '320px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        padding: '20px',
        zIndex: 9999,
        border: '2px solid #2563eb',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#0f172a',
            }}
          >
            🎉 Zustand Demo
          </h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: '#64748b',
            }}
          >
            State persists on reload!
          </p>
        </div>
        <button
          onClick={toggleVisibility}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#64748b',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Message */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#2563eb',
            fontWeight: '500',
          }}
        >
          {message}
        </p>
      </div>

      {/* Counter Display */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#2563eb',
            marginBottom: '8px',
          }}
        >
          {count}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#64748b',
          }}
        >
          Total Clicks
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={decrement}
          disabled={count === 0}
          style={{
            padding: '12px',
            backgroundColor: count === 0 ? '#e2e8f0' : '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: count === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: count === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (count > 0) e.target.style.backgroundColor = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            if (count > 0) e.target.style.backgroundColor = '#f1f5f9';
          }}
        >
          <Minus size={20} color="#0f172a" />
        </button>

        <button
          onClick={increment}
          style={{
            padding: '12px',
            backgroundColor: '#2563eb',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <Plus size={20} color="white" />
        </button>

        <button
          onClick={reset}
          disabled={count === 0}
          style={{
            padding: '12px',
            backgroundColor: count === 0 ? '#fee2e2' : '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            cursor: count === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: count === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (count > 0) e.target.style.backgroundColor = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            if (count > 0) e.target.style.backgroundColor = '#fef2f2';
          }}
        >
          <RotateCcw size={18} color="#dc2626" />
        </button>
      </div>

      {/* Click History */}
      {clicks.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '8px',
            }}
          >
            Recent Clicks (Last {Math.min(clicks.length, 10)})
          </div>
          <div
            style={{
              maxHeight: '120px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              padding: '8px',
            }}
          >
            {clicks
              .slice()
              .reverse()
              .map((click, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    padding: '4px 0',
                    borderBottom:
                      index < clicks.length - 1 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  #{click.count} at{' '}
                  {new Date(click.timestamp).toLocaleTimeString()}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#92400e',
          lineHeight: '1.4',
        }}
      >
        <strong>💡 Try this:</strong> Click buttons, then refresh the page. Your
        count persists thanks to Zustand + localStorage!
      </div>
    </div>
  );
}

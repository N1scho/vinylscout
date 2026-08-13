import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import { fetchPriceInfo, getDiscogsAlbumMetadata } from '../../services/discogsService';
import { designSystem } from '../../designsystem';
import { useErrorStore } from '../../stores/errorStore';
import { ChevronRight } from 'lucide-react';

function generateFakePrices(correctPrice) {
  // Generate 3 random wrong prices in range 50%-150% of correct price
  // Avoid duplicates and the correct price itself
  const fakes = new Set();
  while (fakes.size < 3) {
    const multiplier = 0.5 + Math.random(); // 0.5 to 1.5
    const fakePrice = Math.round(correctPrice * multiplier * 100) / 100;
    // Skip if it's the correct price or already exists
    if (Math.abs(fakePrice - correctPrice) > 0.01 && !fakes.has(fakePrice)) {
      fakes.add(fakePrice);
    }
  }

  const prices = [correctPrice, ...Array.from(fakes)];
  // Shuffle
  for (let i = prices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prices[i], prices[j]] = [prices[j], prices[i]];
  }
  return { prices, correctIndex: prices.indexOf(correctPrice) };
}

export default function PriceGuessGame({ themes }) {
  const {
    shuffledAlbums,
    currentAlbumIndex,
    nextAlbum,
    genres,
    toggleWishlist,
    isInWishlist
  } = useDiscoverStore();

  const [gameState, setGameState] = useState('loading'); // loading, ready, answered
  const [priceInfo, setPriceInfo] = useState(null);
  const [discogsMetadata, setDiscogsMetadata] = useState(null);
  const [prices, setPrices] = useState([]);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const touchStartRef = useRef(null);
  const MIN_SWIPE_DISTANCE = 50;

  const currentAlbum = shuffledAlbums[currentAlbumIndex];
  const genreName = currentAlbum && genres.find(g => g.id === currentAlbum.genreId)?.name;

  useEffect(() => {
    if (!currentAlbum) {
      setGameState('no-albums');
      return;
    }

    const loadPrice = async () => {
      setGameState('loading');
      setPriceInfo(null);
      setSelectedIndex(null);
      setCorrectIndex(null);

      try {
        // First search for the release to get Discogs ID + high-res images
        const metadata = await getDiscogsAlbumMetadata(currentAlbum.artist, currentAlbum.album);

        if (!metadata?.releaseId) {
          setGameState('no-price');
          return;
        }

        // Store metadata for high-res images + wishlist integration
        setDiscogsMetadata(metadata);

        // Then fetch price using the release ID
        const price = await fetchPriceInfo(metadata.releaseId);

        if (price?.value) {
          const { prices: priceList, correctIndex: correctIdx } = generateFakePrices(price.value);
          setPriceInfo(price);
          setPrices(priceList);
          setCorrectIndex(correctIdx);
          setGameState('ready');
        } else {
          setGameState('no-price');
        }
      } catch (error) {
        console.error('Failed to load price:', error);
        useErrorStore.getState().addError({
          message: `Failed to load price for ${currentAlbum.artist} - ${currentAlbum.album}`,
          details: error.message
        });
        setGameState('error');
      }
    };

    loadPrice();
  }, [currentAlbum?.id]);

  const handleGuess = useCallback((guessIndex) => {
    setSelectedIndex(guessIndex);
    const isCorrect = guessIndex === correctIndex;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    setGameState('answered');
  }, [correctIndex]);

  const handleNext = useCallback(() => {
    nextAlbum();
  }, [nextAlbum]);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || gameState !== 'answered') return;

    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEnd;

    if (Math.abs(distance) >= MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        // Swiped left, go to next album
        handleNext();
      }
    }

    touchStartRef.current = null;
  };

  if (!currentAlbum) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: themes.textSecondary,
        fontSize: '16px'
      }}>
        Select genres to play
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      minHeight: '500px'
    }}>
      {/* Score */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: themes.surface,
        borderRadius: '8px',
        border: `1px solid ${themes.border}`,
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{
          fontSize: designSystem.typography.sizes.sm,
          color: themes.textSecondary,
          marginBottom: '4px'
        }}>
          Score
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: themes.primary
        }}>
          {score.correct} / {score.total}
        </div>
      </div>

      {/* Album Info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        width: '100%'
      }}>
        {/* Cover + Next Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: 'center'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        >
          <div style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            flexShrink: 0
          }}>
            <img
              src={discogsMetadata?.images?.[0]?.url || currentAlbum.coverUrl}
              alt={currentAlbum.album}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                objectFit: 'cover',
                border: `2px solid ${themes.border}`
              }}
            />
            {gameState === 'answered' && (
              <button
                onClick={() => toggleWishlist(currentAlbum.id)}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isInWishlist(currentAlbum.id) ? themes.primary : themes.surface,
                  border: `2px solid ${themes.primary}`,
                  color: isInWishlist(currentAlbum.id) ? '#ffffff' : themes.primary,
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
                title={isInWishlist(currentAlbum.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                ♥
              </button>
            )}
          </div>

          {/* Next Button */}
          {gameState === 'answered' && (
            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                backgroundColor: themes.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '24px',
                transition: 'all 200ms ease',
                flexShrink: 0,
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
              title="Next album (or swipe left)"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>

        {/* Album Details */}
        <div style={{
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{
            fontSize: designSystem.typography.sizes.base,
            fontWeight: 'bold',
            color: themes.text
          }}>
            {currentAlbum.album}
          </div>
          <div style={{
            fontSize: designSystem.typography.sizes.sm,
            color: themes.textSecondary,
            marginTop: '4px'
          }}>
            {currentAlbum.artist} • {currentAlbum.year || ''}
          </div>
          {genreName && (
            <div style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.primary,
              marginTop: '4px'
            }}>
              {genreName}
            </div>
          )}
        </div>
      </div>

      {/* Game State */}
      {gameState === 'loading' && (
        <div style={{
          fontSize: '14px',
          color: themes.textSecondary
        }}>
          Loading price...
        </div>
      )}

      {gameState === 'no-price' && (
        <div style={{
          padding: '16px',
          backgroundColor: themes.surface,
          borderRadius: '8px',
          border: `1px solid ${themes.border}`,
          color: themes.textSecondary,
          fontSize: '14px',
          textAlign: 'center'
        }}>
          No price data available. Skipping...
        </div>
      )}

      {gameState === 'error' && (
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderRadius: '8px',
          border: '1px solid #dc2626',
          color: '#dc2626',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Failed to load price. Try again.
        </div>
      )}

      {(gameState === 'ready' || gameState === 'answered') && prices.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          width: '100%',
          maxWidth: '320px'
        }}>
          {prices.map((price, idx) => {
            const isCorrect = idx === correctIndex;
            const isSelected = idx === selectedIndex;
            const isAnswered = gameState === 'answered';

            let bgColor = themes.surface;
            let borderColor = themes.border;
            let textColor = themes.text;

            if (isAnswered) {
              if (isCorrect) {
                bgColor = '#10b981';
                borderColor = '#059669';
                textColor = '#ffffff';
              } else if (isSelected && !isCorrect) {
                bgColor = '#ef4444';
                borderColor = '#dc2626';
                textColor = '#ffffff';
              } else if (isSelected) {
                bgColor = '#ef4444';
                borderColor = '#dc2626';
                textColor = '#ffffff';
              }
            } else if (isSelected) {
              bgColor = themes.primary;
              borderColor = themes.primary;
              textColor = '#ffffff';
            }

            return (
              <button
                key={idx}
                onClick={() => !isAnswered && handleGuess(idx)}
                disabled={isAnswered}
                style={{
                  padding: '16px 12px',
                  backgroundColor: bgColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '8px',
                  cursor: isAnswered ? 'default' : 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: 'bold',
                  color: textColor,
                  transition: 'all 200ms ease',
                  opacity: isAnswered && !isCorrect && !isSelected ? 0.5 : 1,
                  transform: isSelected && !isAnswered ? 'scale(1.05)' : 'scale(1)',
                  pointerEvents: isAnswered ? 'none' : 'auto'
                }}
              >
                €{price.toFixed(2)}
              </button>
            );
          })}
        </div>
      )}

      {gameState === 'no-albums' && (
        <div style={{
          padding: '16px',
          color: themes.textSecondary,
          fontSize: '14px',
          textAlign: 'center'
        }}>
          No albums selected. Go to Filter tab.
        </div>
      )}

      {gameState === 'answered' && priceInfo && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: themes.surface,
          borderRadius: '8px',
          border: `1px solid ${themes.border}`,
          fontSize: designSystem.typography.sizes.sm,
          color: themes.textSecondary,
          textAlign: 'center'
        }}>
          <div>Lowest price: €{priceInfo.value.toFixed(2)}</div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            {priceInfo.num_for_sale} for sale on Discogs
          </div>
        </div>
      )}
    </div>
  );
}

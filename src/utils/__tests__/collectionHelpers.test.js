import { filterCollection } from '../collectionHelpers';

describe('filterCollection', () => {
  const mockItems = [
    { id: 1, title: 'Artist 1 - Album 1', isFavorite: false },
    { id: 2, title: 'Artist 2 - Album 2', isFavorite: true },
    { id: 3, title: 'Artist 3 - Album 3', isFavorite: false },
  ];

  it('filters wishlist correctly with provided wishlistIds', () => {
    const wishlistIds = [1, 3];
    const result = filterCollection(mockItems, 'wishlist', '', null, null, null, wishlistIds);
    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual([1, 3]);
  });

  it('filters wishlist correctly with empty wishlistIds', () => {
    const result = filterCollection(mockItems, 'wishlist', '', null, null, null, []);
    expect(result).toHaveLength(0);
  });

  it('filters favorites correctly', () => {
    const result = filterCollection(mockItems, 'favorites', '', null, null, null, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});

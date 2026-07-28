import { useDiscoverStore } from '../discoverStore';

describe('discoverStore', () => {
  beforeEach(() => {
    useDiscoverStore.setState({
      selectedGenreIds: ['rock', 'jazz'],
      userClearedGenres: false,
      userClearTimestamp: 0,
    });
  });

  it('tracks user clear action with timestamp', () => {
    const before = Date.now();
    useDiscoverStore.getState().clearAllGenres();
    const after = Date.now();

    const state = useDiscoverStore.getState();
    expect(state.selectedGenreIds).toEqual([]);
    expect(state.userClearedGenres).toBe(true);
    expect(state.userClearTimestamp).toBeGreaterThanOrEqual(before);
    expect(state.userClearTimestamp).toBeLessThanOrEqual(after);
  });

  it('resets user clear flag', () => {
    useDiscoverStore.getState().clearAllGenres();
    useDiscoverStore.getState().resetUserClearFlag();

    const state = useDiscoverStore.getState();
    expect(state.userClearedGenres).toBe(false);
  });
});

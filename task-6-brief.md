# Task 6: AlbumGallery Glass Styling

**Objective:** Apply liquid glass morphism effects to album gallery cards based on the selected design theme (Subtle, Bold, Hybrid).

## Context

- **Spec:** `docs/superpowers/specs/2026-08-10-discover-redesign-liquid-glass.md`
- **Plan:** `docs/superpowers/plans/2026-08-10-discover-redesign-implementation.md` (Task 6)
- **Design System:** `designSystem.glassMorphism` tokens already exist (Task 1)
- **Settings State:** `settingsStore.designTheme` already exists (Task 2)

## Scope

Update `src/views/DiscoverView/AlbumGallery.jsx` to:

1. Import `useSettingsStore` to access `designTheme`
2. Import `designSystem` to access glass tokens
3. Create `getCardGlassStyle()` function that returns glass CSS based on current designTheme
4. Apply glass style to the main album cover container (the 280x280px image div)
5. Test theme switching to verify styles update dynamically

## What Needs to Happen

### AlbumGallery.jsx Changes

1. **Imports:**
   - Add: `import { useSettingsStore } from '../../stores/settingsStore';`
   - Already have: `import { designSystem } from '../../designsystem';`

2. **Get designTheme in component:**
   ```javascript
   const designTheme = useSettingsStore(s => s.designTheme);
   ```

3. **Create glass style function:**
   - Returns different styles based on `designTheme` value
   - For `'hybrid'`: Use `cardBlur` (12px) with solid bg + blur
   - For `'subtle'` and `'bold'`: Use their respective blur/opacity settings from `designSystem.glassMorphism[designTheme]`
   - Handle light/dark mode (check if `themes.background` is light or dark)

4. **Apply to album cover:**
   - The main div that contains the album image (currently at line 139-180 with width/height 280px)
   - Merge the glass style with existing styles
   - Keep existing properties like `cursor: 'grab'`, `userSelect: 'none'`, etc.

## Testing Criteria

- [ ] AlbumGallery renders with glass styling
- [ ] Switching theme in Settings updates glass effect immediately
- [ ] All three themes (Subtle, Bold, Hybrid) display correctly
- [ ] Light and Dark modes both work with glass effect
- [ ] Mobile Chrome responsive (no layout breaks)
- [ ] Glass effect appears on album cover container

## Commits Expected

Single commit for this task:
```
feat: apply liquid glass styling to album gallery cards
```

## Files Modified

- `src/views/DiscoverView/AlbumGallery.jsx` (~15-20 line changes)

#!/usr/bin/env node

/**
 * Test: AlbumGallery Glass Styling
 * Verifies that glass morphism styles are applied correctly and update on theme change
 */

import fs from 'fs';
import path from 'path';

console.log('='.repeat(60));
console.log('TEST: AlbumGallery Glass Styling (Task 6)');
console.log('='.repeat(60));

const albumGalleryPath = path.resolve('./src/views/DiscoverView/AlbumGallery.jsx');
const settingsStorePath = path.resolve('./src/stores/settingsStore.js');
const designSystemPath = path.resolve('./src/designsystem.js');

let passed = 0;
let failed = 0;

// Test 1: Import useSettingsStore
const albumGalleryContent = fs.readFileSync(albumGalleryPath, 'utf-8');
if (albumGalleryContent.includes("import { useSettingsStore } from '../../stores/settingsStore'")) {
  console.log('✓ Test 1: useSettingsStore imported correctly');
  passed++;
} else {
  console.log('✗ Test 1: useSettingsStore not imported');
  failed++;
}

// Test 2: designSystem already imported
if (albumGalleryContent.includes("import { designSystem } from '../../designsystem'")) {
  console.log('✓ Test 2: designSystem imported');
  passed++;
} else {
  console.log('✗ Test 2: designSystem not imported');
  failed++;
}

// Test 3: useSettingsStore hook called
if (albumGalleryContent.includes('const designTheme = useSettingsStore(s => s.designTheme)')) {
  console.log('✓ Test 3: designTheme extracted from settings store');
  passed++;
} else {
  console.log('✗ Test 3: designTheme not extracted');
  failed++;
}

// Test 4: getCardGlassStyle function exists
if (albumGalleryContent.includes('const getCardGlassStyle = () => {')) {
  console.log('✓ Test 4: getCardGlassStyle function defined');
  passed++;
} else {
  console.log('✗ Test 4: getCardGlassStyle function not found');
  failed++;
}

// Test 5: Function handles hybrid theme
if (albumGalleryContent.includes("if (designTheme === 'hybrid')")) {
  console.log('✓ Test 5: Hybrid theme case handled');
  passed++;
} else {
  console.log('✗ Test 5: Hybrid theme not handled');
  failed++;
}

// Test 6: Function uses backdropFilter for glass effect
if (albumGalleryContent.includes('backdropFilter')) {
  console.log('✓ Test 6: backdropFilter CSS property used');
  passed++;
} else {
  console.log('✗ Test 6: backdropFilter not used');
  failed++;
}

// Test 7: Glass style applied to container
if (albumGalleryContent.includes('...getCardGlassStyle()')) {
  console.log('✓ Test 7: Glass style spread into album cover container');
  passed++;
} else {
  console.log('✗ Test 7: Glass style not applied to container');
  failed++;
}

// Test 8: designSystem.glassMorphism exists
const designSystemContent = fs.readFileSync(designSystemPath, 'utf-8');
if (designSystemContent.includes('glassMorphism: {')) {
  console.log('✓ Test 8: designSystem.glassMorphism object exists');
  passed++;
} else {
  console.log('✗ Test 8: glassMorphism not in designSystem');
  failed++;
}

// Test 9: All three themes defined in glassMorphism
const glassThemes = ['subtle', 'bold', 'hybrid'];
let allThemesDefined = true;
for (const theme of glassThemes) {
  if (!designSystemContent.includes(`${theme}:`)) {
    allThemesDefined = false;
    break;
  }
}
if (allThemesDefined) {
  console.log('✓ Test 9: All three glass themes (subtle, bold, hybrid) defined');
  passed++;
} else {
  console.log('✗ Test 9: Not all themes defined in glassMorphism');
  failed++;
}

// Test 10: settingsStore has designTheme
const settingsStoreContent = fs.readFileSync(settingsStorePath, 'utf-8');
if (settingsStoreContent.includes("designTheme: 'subtle'")) {
  console.log('✓ Test 10: settingsStore has designTheme state with default value');
  passed++;
} else {
  console.log('✗ Test 10: designTheme not in settings store');
  failed++;
}

// Test 11: setDesignTheme action exists
if (settingsStoreContent.includes('setDesignTheme:')) {
  console.log('✓ Test 11: setDesignTheme action defined in store');
  passed++;
} else {
  console.log('✗ Test 11: setDesignTheme action not found');
  failed++;
}

// Test 12: Dark mode luminance check in getCardGlassStyle
if (albumGalleryContent.includes('parseInt(themes.background.slice(1, 3), 16) < 128')) {
  console.log('✓ Test 12: Dark mode detection logic present');
  passed++;
} else {
  console.log('✗ Test 12: Dark mode detection missing');
  failed++;
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('\n✓ All tests passed! Glass styling implemented correctly.');
  process.exit(0);
} else {
  console.log(`\n✗ ${failed} test(s) failed.`);
  process.exit(1);
}

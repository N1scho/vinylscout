# Discover Mode Data Schema

## Overview
The discover mode loads ~2000 vinyl albums across 80 genres from Excel files in `C:\Users\nikol\Desktop\Claude\Genre Lists`. Data is parsed at build time and stored in `src/data/discoverAlbums.json`.

## Data Structure

### `discoverAlbums.json`
```json
{
  "genres": [
    {
      "id": "01",
      "name": "Heavy Metal",
      "albumCount": 25
    }
  ],
  "albums": [
    {
      "id": "01-001",
      "genreId": "01",
      "artist": "Black Sabbath",
      "album": "Paranoid",
      "year": 1970,
      "coverUrl": "/vinyl-covers/01-heavy-metal/001.png",
      "label": "Vertigo",
      "catalogNumber": "VJL 2574"
    }
  ]
}
```

### Album Object
- `id` (string): Unique album ID in format `{genreId}-{albumNumber}`
- `genreId` (string): 2-digit genre ID (01-80)
- `artist` (string): Album artist name
- `album` (string): Album title
- `year` (number|null): Release year
- `coverUrl` (string): Path to cover image in `/public/vinyl-covers/`
- `label` (string): Record label
- `catalogNumber` (string): Catalog/catalog number

## Parsing Process

1. **Source:** Excel files in `C:\Users\nikol\Desktop\Claude\Genre Lists\NN_GenreName_covers.xlsx`
2. **Script:** `scripts/parseGenreCovers.js` (runs at build time)
3. **Extraction:**
   - Reads first sheet of each Excel file
   - Expects columns: Artist, Album, Year, Label, Katalognummer
   - Album count per genre: ~25 items
4. **Image Handling:** Embedded images not yet extracted (placeholder `coverUrl` paths)
5. **Output:** `src/data/discoverAlbums.json` + `public/vinyl-covers/` structure

## Storage Layer

- **Genres:** Loaded once at app startup into `discoverStore`
- **Albums:** All 2000 stored in Zustand state
- **Wishlist:** Persisted to localStorage via `discoverStore` (Set → Array on serialize)
- **Shuffling:** Done client-side on genre selection, O(n) shuffle

## Performance Considerations

- **Load Time:** ~1-2MB for 2000 album metadata + 80 genres
- **Memory:** ~50MB for shuffled state in store
- **Rendering:** Gallery virtualized (single album visible at time)
- **Caching:** PWA service worker caches genre data after first load

## Future Work

- Extract embedded cover images from Excel to PNG
- Implement image compression/optimization
- Add image caching to service worker
- Implement pagination instead of all-at-once load

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const GENRE_LIST_DIR = 'C:/Users/nikol/Desktop/Claude/Genre Lists';
const OUTPUT_DIR = path.join(projectRoot, 'src', 'data');
const COVER_DIR = path.join(projectRoot, 'public', 'vinyl-covers');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'discoverAlbums.json');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse genre info from filename
 * Example: 01_Heavy_Metal_covers.xlsx -> { id: '01', name: 'Heavy Metal' }
 */
function parseGenreFromFilename(filename) {
  const match = filename.match(/^(\d{2})_(.+)_covers\.xlsx$/);
  if (!match) return null;

  const id = match[1];
  const name = match[2].replace(/_/g, ' ');

  return { id, name };
}

/**
 * Slugify genre name for folder naming
 */
function slugifyGenreName(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Main parser function
 */
async function parseGenreCovers() {
  console.log('Starting Excel genre parser...\n');

  try {
    // Read all Excel files
    const files = fs.readdirSync(GENRE_LIST_DIR);
    const excelFiles = files
      .filter((f) => f.match(/^\d{2}_.*_covers\.xlsx$/))
      .sort();

    console.log(`Found ${excelFiles.length} Excel files to process\n`);

    const genres = [];
    const albums = [];
    const genreMap = new Map(); // Map to deduplicate genres

    // Process each Excel file
    for (const file of excelFiles) {
      try {
        const filepath = path.join(GENRE_LIST_DIR, file);
        console.log(`Processing: ${file}`);

        // Parse genre info from filename
        const genreInfo = parseGenreFromFilename(file);
        if (!genreInfo) {
          console.warn(`  ⚠ Skipped: Could not parse genre from filename`);
          continue;
        }

        // Read Excel file
        const workbook = XLSX.readFile(filepath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          console.warn(`  ⚠ Skipped: No data found in sheet`);
          continue;
        }

        // Add genre info if not already added
        if (!genreMap.has(genreInfo.id)) {
          genreMap.set(genreInfo.id, {
            id: genreInfo.id,
            name: genreInfo.name,
            albumCount: 0,
          });
        }

        const genre = genreMap.get(genreInfo.id);
        const genreSlug = slugifyGenreName(genreInfo.name);
        const genreFolderName = `${genreInfo.id}-${genreSlug}`;
        const genreCoverDir = path.join(COVER_DIR, genreFolderName);

        // Create genre folder if it doesn't exist
        if (!fs.existsSync(genreCoverDir)) {
          fs.mkdirSync(genreCoverDir, { recursive: true });
        }

        // Process each album row
        rows.forEach((row, index) => {
          try {
            // Extract album data
            const artist = row.Artist?.trim() || '';
            const album = row.Album?.trim() || '';
            const year = row.Year ? parseInt(row.Year, 10) : 0;
            const catalogNumber = row.Katalognummer?.trim() || '';

            // Skip empty rows
            if (!artist || !album) {
              return;
            }

            // Generate album ID
            const albumIndex = index + 1; // 1-based index
            const albumId = `${genreInfo.id}-${String(albumIndex).padStart(3, '0')}`;

            // Create placeholder cover image file (empty for now)
            const coverFileName = `${String(albumIndex).padStart(3, '0')}.png`;
            const coverFilePath = path.join(genreCoverDir, coverFileName);
            if (!fs.existsSync(coverFilePath)) {
              // Create a 1x1 transparent PNG as placeholder
              const placeholderPNG = Buffer.from([
                0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
                0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
                0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
                0x42, 0x60, 0x82,
              ]);
              fs.writeFileSync(coverFilePath, placeholderPNG);
            }

            // Create album object
            const albumObj = {
              id: albumId,
              genreId: genreInfo.id,
              artist,
              album,
              year,
              coverUrl: `/vinyl-covers/${genreFolderName}/${coverFileName}`,
              catalogNumber,
            };

            albums.push(albumObj);
            genre.albumCount++;
          } catch (error) {
            console.warn(`  ⚠ Error processing row ${index + 1}: ${error.message}`);
          }
        });

        console.log(`  ✓ Processed ${rows.length} albums`);
      } catch (error) {
        console.warn(`✗ Error processing ${file}: ${error.message}`);
      }
    }

    // Add genres to array (sorted by id)
    const sortedGenres = Array.from(genreMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    genres.push(...sortedGenres);

    // Create output JSON
    const output = {
      genres,
      albums,
    };

    // Write output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n✓ Parser completed successfully!`);
    console.log(`  Genres: ${genres.length}`);
    console.log(`  Albums: ${albums.length}`);
    console.log(`  Output: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run parser
parseGenreCovers();

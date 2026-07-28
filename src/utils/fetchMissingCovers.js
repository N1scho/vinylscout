/**
 * Fetch missing album cover images from Discogs API
 * Uses the Discogs ID to look up release and get thumb image
 */

async function fetchCoverFromDiscogs(discogsId) {
  try {
    const response = await fetch('/api/discogs-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: `/releases/${discogsId}`
      })
    });

    if (!response.ok) {
      console.warn(`[fetchMissingCovers] Failed to fetch cover for ID ${discogsId}:`, response.status);
      return null;
    }

    const data = await response.json();
    return data.thumb || null;
  } catch (error) {
    console.error(`[fetchMissingCovers] Error fetching cover for ID ${discogsId}:`, error.message);
    return null;
  }
}

export async function fetchMissingCovers(collection, onProgress) {
  const missingCoverItems = collection.filter(item => !item.cover_image && !item.thumb);

  if (missingCoverItems.length === 0) {
    return { updated: 0, failed: 0, updated_collection: collection };
  }

  const updated = [];
  const failed = [];
  const updatedCollection = collection.map(item => ({ ...item }));

  for (let i = 0; i < missingCoverItems.length; i++) {
    const item = missingCoverItems[i];
    onProgress?.(i + 1, missingCoverItems.length);

    const cover = await fetchCoverFromDiscogs(item.id);

    if (cover) {
      const idx = updatedCollection.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        updatedCollection[idx].cover_image = cover;
        updated.push(item.title);
      }
    } else {
      failed.push(item.title);
    }

    // Rate limit: delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`[fetchMissingCovers] Updated ${updated.length} covers, ${failed.length} failed`);
  return { updated: updated.length, failed: failed.length, updated_collection: updatedCollection };
}

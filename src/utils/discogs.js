/**
 * Discogs data utilities
 * Handles Discogs API response inconsistencies (format/label as string or array)
 */

export const getFirstValue = (field) => {
  if (!field) return null;
  return Array.isArray(field) ? field[0] : field;
};

export const getAllValues = (field) => {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
};

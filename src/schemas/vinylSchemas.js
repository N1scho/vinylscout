/**
 * Validation Schemas - Zod
 *
 * Type-safe validation for vinyl records and related data
 * Prevents data corruption and provides clear error messages
 */

import { z } from 'zod';

// Price schema
export const PriceSchema = z.object({
  value: z.number().positive('Price must be positive').max(1000000, 'Price too high'),
  currency: z.string().length(3, 'Currency must be 3-letter code')
});

// Price history entry schema
export const PriceHistoryEntrySchema = z.object({
  date: z.string().datetime('Invalid date format'),
  price: z.number().positive(),
  currency: z.string().length(3)
});

// Vinyl record schema
export const VinylSchema = z.object({
  id: z.union([z.string(), z.number()]).refine(
    (val) => {
      const num = typeof val === 'string' ? parseInt(val) : val;
      return !isNaN(num) && num > 0;
    },
    { message: 'ID must be a positive number' }
  ),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  artist: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional().refine(
    (val) => {
      if (val === undefined || val === null) return true;
      const num = typeof val === 'string' ? parseInt(val) : val;
      return !isNaN(num) && num >= 1900 && num <= new Date().getFullYear() + 1;
    },
    { message: 'Year must be between 1900 and current year' }
  ),
  cover_image: z.string().url().optional().or(z.literal('')),
  thumb: z.string().url().optional().or(z.literal('')),
  price: PriceSchema.optional().nullable(),
  lowestPrice: z.number().optional().nullable(),
  priceHistory: z.array(PriceHistoryEntrySchema).optional(),
  favorite: z.boolean().optional(),
  format: z.string().optional(),
  label: z.string().optional(),
  country: z.string().optional(),
  genres: z.array(z.string()).optional(),
  tracklist: z.array(z.any()).optional()
});

// Advanced search schema
export const AdvancedSearchSchema = z.object({
  artist: z.string().max(200, 'Artist name too long').optional(),
  album: z.string().max(200, 'Album name too long').optional(),
  year: z.string().max(4, 'Year must be 4 digits').optional(),
  label: z.string().max(200, 'Label name too long').optional(),
  genre: z.string().max(100, 'Genre name too long').optional()
});

// Settings schema
export const SettingsSchema = z.object({
  theme: z.string().min(1, 'Theme is required'),
  customColors: z.object({
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    textSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    success: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    error: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    warning: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
  }).partial().optional(),
  selectedShops: z.array(z.string()).optional()
});

/**
 * Validation helper - returns { success: boolean, data?: T, error?: string }
 */
export function validateData(schema, data) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message nicely
  let errorMessage = 'Validation failed';
  try {
    if (result.error?.errors?.length > 0) {
      errorMessage = result.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
    }
  } catch (e) {
    errorMessage = result.error?.message || 'Validation failed';
  }

  return {
    success: false,
    error: errorMessage,
    details: result.error
  };
}

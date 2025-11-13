import type { Metadata } from 'next';
import { AstoriaConquestClient } from './client';
import { metadata as pageMetadata } from './metadata';

export const metadata: Metadata = pageMetadata;

/**
 * Astoria Conquest Page
 *
 * This page displays an interactive map showing your running conquest of Astoria.
 * Data is fetched client-side from API routes to keep the bundle size small.
 *
 * Data files are generated weekly by the backend Python script and served via:
 * - /api/astoria/base-map (1.0 MB)
 * - /api/astoria/covered-streets (156 KB)
 * - /api/astoria/stats (4 KB)
 */

export default function AstoriaConquestPage() {
  // Data will be fetched client-side by the AstoriaConquestClient component
  // This keeps the page bundle small and allows the data to be cached by CDN
  return <AstoriaConquestClient />;
}

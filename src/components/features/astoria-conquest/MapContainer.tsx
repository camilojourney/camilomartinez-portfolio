'use client';

import dynamic from 'next/dynamic';
import type { MapContainerProps } from '@/types/astoria';

const AstoriaMap = dynamic(
  () => import('@/components/features/astoria-conquest/AstoriaMap'),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black/20 animate-pulse" /> 
  }
);

export function MapContainer({ baseMapData, coveredStreetsData, selectedRun }: MapContainerProps) {
  return (
    <div className="w-full h-[600px] bg-black/20 rounded-xl overflow-hidden">
      {baseMapData && (
        <AstoriaMap 
          baseMapData={baseMapData} 
          coveredStreetsData={coveredStreetsData}
          selectedRun={selectedRun}
        />
      )}
    </div>
  );
}
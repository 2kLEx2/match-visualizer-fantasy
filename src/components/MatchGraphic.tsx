
import React, { useEffect, useState, useRef, memo } from 'react';
import { Match } from '@/lib/api/matches';
import { useToast } from '@/components/ui/use-toast';
import { useImageLoader } from '@/lib/utils/imageLoader';
import { MatchRow } from './MatchRow';

interface MatchGraphicProps {
  matches: Match[];
  settings: {
    showLogos: boolean;
    showTime: boolean;
    backgroundColor: string;
    textColor: string;
    scale: number;
  };
}

export const MatchGraphic = memo(({ matches, settings }: MatchGraphicProps) => {
  const scaleFactor = settings.scale / 100;
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { loadImages } = useImageLoader();
  const previousMatches = useRef<string>('');

  useEffect(() => {
    // Only run when matches actually change to prevent infinite loops
    const matchIds = matches.map(m => m.id).join(',');
    if (previousMatches.current === matchIds) {
      return;
    }
    previousMatches.current = matchIds;

    // Get all unique logos that need to be loaded
    const allLogos = Array.from(new Set(
      matches.flatMap(match => [match.team1.logo, match.team2.logo])
        .filter((logo): logo is string => !!logo && typeof logo === 'string' && logo.trim() !== '')
    ));

    if (allLogos.length > 0) {
      // Set immediate loading states for all logos
      const initialLoadingStates = allLogos.reduce((acc, logo) => {
        acc[logo] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      setLoadingStates(initialLoadingStates);
      
      loadImages(
        allLogos,
        (url, state) => {
          setLoadedImages(prev => ({ ...prev, [url]: state.loaded }));
          setLoadingStates(prev => ({ ...prev, [url]: state.loading }));
        },
        (message) => {
          // Only show one toast per batch to avoid spamming
          console.warn(message);
        }
      );
    }
  }, [matches, loadImages, toast]);

  const isBIGMatch = (match: Match) => {
    return match.team1.name === "BIG" || match.team2.name === "BIG";
  };

  return (
    <div 
      data-graphic="true"
      className="relative overflow-hidden"
      style={{
        width: '600px',
        minHeight: '400px',
        maxHeight: '800px',
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
      }}
    >
      <div 
        className="w-full h-full p-6"
        style={{
          backgroundColor: settings.backgroundColor || '#1a1b1e',
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://i.imgur.com/tYDGmvR.png)`,
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h1 className="text-2xl font-bold text-white mb-6 text-right pr-4">
          Watchparty Schedule
        </h1>

        <div className="space-y-4">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              isBIG={isBIGMatch(match)}
              showTime={settings.showTime}
              showLogos={settings.showLogos}
              loadedImages={loadedImages}
              loadingStates={loadingStates}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

MatchGraphic.displayName = 'MatchGraphic';

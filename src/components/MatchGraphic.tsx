
import React, { useEffect, useState } from 'react';
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

export const MatchGraphic = ({ matches, settings }: MatchGraphicProps) => {
  const scaleFactor = settings.scale / 100;
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { loadImages } = useImageLoader();

  useEffect(() => {
    const allLogos = matches.flatMap(match => [match.team1.logo, match.team2.logo])
      .filter((logo): logo is string => !!logo);

    loadImages(
      allLogos,
      (url, state) => {
        setLoadedImages(prev => ({ ...prev, [url]: state.loaded }));
        setLoadingStates(prev => ({ ...prev, [url]: state.loading }));
      },
      (message) => {
        toast({
          title: "Warning",
          description: message,
          variant: "default",
        });
      }
    );
  }, [matches]);

  const isBIGMatch = (match: Match) => {
    return match.team1.name === "BIG" || match.team2.name === "BIG";
  };

  return (
    <div 
      className="space-y-4 w-[600px] animate-fade-in relative"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        background: `url(/lovable-uploads/96a04188-0b52-48a9-aeab-62eb8135d21d.png) top center no-repeat`,
        backgroundSize: 'cover',
        minHeight: '100%',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <h1 className="text-2xl font-bold text-white mb-4 text-right pr-4">
        Watchparty Schedule
      </h1>

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
  );
};

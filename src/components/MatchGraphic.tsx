import React, { useEffect, useState } from 'react';
import { Match } from '@/lib/api/matches';
import { Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  const [loadedImages, setLoadedImages] = useState<Record<string, string | null>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getProxiedImageUrl = async (url: string) => {
    try {
      // Use imgproxy.net as it's more reliable for this use case
      const proxyUrl = `https://imgproxy.net/api/v1/fetch?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error('Failed to load image');
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching image:', error);
      toast({
        title: "Error loading image",
        description: "Failed to load team logo",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    const loadImages = async () => {
      const newLoadingStates: Record<string, boolean> = {};
      
      for (const match of matches) {
        if (match.team1.logo) {
          newLoadingStates[match.team1.logo] = true;
          try {
            const imageUrl = await getProxiedImageUrl(match.team1.logo);
            setLoadedImages(prev => ({ ...prev, [match.team1.logo!]: imageUrl }));
          } catch (error) {
            console.error(`Failed to load logo for ${match.team1.name}:`, error);
            setLoadedImages(prev => ({ ...prev, [match.team1.logo!]: null }));
          } finally {
            newLoadingStates[match.team1.logo] = false;
          }
        }
        
        if (match.team2.logo) {
          newLoadingStates[match.team2.logo] = true;
          try {
            const imageUrl = await getProxiedImageUrl(match.team2.logo);
            setLoadedImages(prev => ({ ...prev, [match.team2.logo!]: imageUrl }));
          } catch (error) {
            console.error(`Failed to load logo for ${match.team2.name}:`, error);
            setLoadedImages(prev => ({ ...prev, [match.team2.logo!]: null }));
          } finally {
            newLoadingStates[match.team2.logo] = false;
          }
        }
      }
      
      setLoadingStates(newLoadingStates);
    };

    loadImages();

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(loadedImages).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [matches]);

  const renderLogo = (logo: string | undefined, teamName: string) => {
    if (!logo) {
      return (
        <div className="w-[24px] h-[24px] flex items-center justify-center">
          <Shield className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    // Show loading state
    if (loadingStates[logo]) {
      return (
        <div className="w-[24px] h-[24px] flex items-center justify-center">
          <Shield className="w-5 h-5 text-gray-400 animate-pulse" />
        </div>
      );
    }

    // Show proxied image if available
    const proxiedUrl = loadedImages[logo];
    if (proxiedUrl) {
      return (
        <img 
          src={proxiedUrl}
          alt={`${teamName} logo`}
          className="w-[24px] h-[24px] object-contain"
          onError={() => setLoadedImages(prev => ({ ...prev, [logo]: null }))}
        />
      );
    }

    // Fallback to shield if image failed to load
    return (
      <div className="w-[24px] h-[24px] flex items-center justify-center">
        <Shield className="w-5 h-5 text-gray-400" />
      </div>
    );
  };

  const isBIGMatch = (match: Match) => {
    return match.team1.name === "BIG" || match.team2.name === "BIG";
  };

  return (
    <div 
      className="space-y-4 w-[600px] animate-fade-in relative"
      style={{
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'top left',
        backgroundImage: 'url(https://static-cdn.jtvnw.net/jtv_user_pictures/60c2e503-6d45-4e92-980a-5ff326c2ffc0-channel_offline_image-1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <h1 className="text-2xl font-bold text-white mb-4 text-center">
        Watchparty Schedule
      </h1>

      {matches.map((match) => {
        const isBIG = isBIGMatch(match);
        return (
          <div key={match.id} className="space-y-1">
            <div 
              className={`rounded-md overflow-hidden transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm ${
                isBIG ? 'bg-primary/20' : 'bg-[#1B2028]/90'
              }`}
            >
              <div className="px-3 py-2 flex items-center">
                {/* Match Time */}
                {settings.showTime && (
                  <div className="text-base font-medium text-gray-400 w-[70px]">
                    {match.time}
                  </div>
                )}

                {/* Teams Container */}
                <div className="flex items-center gap-8 flex-1">
                  {/* Team 1 */}
                  <div className="flex items-center gap-2">
                    {settings.showLogos && renderLogo(match.team1.logo, match.team1.name)}
                    <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
                      {match.team1.name}
                    </span>
                  </div>

                  {/* VS Separator */}
                  <span className="text-xs font-medium text-gray-500">
                    vs
                  </span>

                  {/* Team 2 */}
                  <div className="flex items-center gap-2">
                    {settings.showLogos && renderLogo(match.team2.logo, match.team2.name)}
                    <span className={`text-base font-medium ${isBIG ? 'text-primary' : 'text-white'}`}>
                      {match.team2.name}
                    </span>
                  </div>
                </div>

                {/* Tournament region indicator */}
                <div className="text-xs font-medium text-gray-500 uppercase ml-2">
                  {match.tournament}
                </div>
              </div>
            </div>
            {isBIG && (
              <div className="text-xs text-primary font-medium italic pl-[70px]">
                Anwesenheitspflicht
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

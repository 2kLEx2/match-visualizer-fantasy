
import React, { useState, useEffect, memo } from 'react';
import { Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamLogoProps {
  logo?: string;
  teamName: string;
  isLoading: boolean;
  isLoaded: boolean;
}

export const TeamLogo = memo(({ logo, teamName, isLoading, isLoaded }: TeamLogoProps) => {
  const [hasError, setHasError] = useState(false);
  const fallbackImage = 'https://picsum.photos/64/64';
  
  // Reset error state if logo changes
  useEffect(() => {
    setHasError(false);
  }, [logo]);

  // Ensure `logo` is a valid string
  const safeLogo = typeof logo === "string" && logo.trim() !== "" ? logo : null;
  
  // Loading state
  if (isLoading) {
    return (
      <Avatar className="w-[24px] h-[24px] flex items-center justify-center">
        <AvatarFallback>
          <Shield className="w-5 h-5 text-gray-400 animate-pulse" />
        </AvatarFallback>
      </Avatar>
    );
  }

  // Handle case where we have no logo or logo already failed to load
  if (!safeLogo || hasError) {
    return (
      <Avatar className="w-[24px] h-[24px] flex items-center justify-center">
        <AvatarImage
          src={fallbackImage}
          alt={`${teamName} logo fallback`}
          className="object-contain w-full h-full"
          style={{ aspectRatio: '1/1' }}
        />
        <AvatarFallback>
          <Shield className="w-5 h-5 text-gray-400" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="w-[24px] h-[24px] flex items-center justify-center bg-transparent border-0">
      {isLoaded ? (
        <AvatarImage
          src={safeLogo}
          alt={`${teamName} logo`}
          className="object-contain w-full h-full"
          style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: 'auto' }}
          onError={(e) => {
            console.log(`Failed to load team logo: ${safeLogo}`);
            setHasError(true);
          }}
        />
      ) : (
        <AvatarImage
          src={fallbackImage}
          alt={`${teamName} logo fallback`}
          className="object-contain w-full h-full"
          style={{ aspectRatio: '1/1' }}
        />
      )}
      <AvatarFallback>
        <Shield className="w-5 h-5 text-gray-400" />
      </AvatarFallback>
    </Avatar>
  );
});

TeamLogo.displayName = 'TeamLogo';

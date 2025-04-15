
import React from 'react';
import { Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface TeamLogoProps {
  logo?: string;
  teamName: string;
  isLoading: boolean;
  isLoaded: boolean;
}

export const TeamLogo = ({ logo, teamName, isLoading, isLoaded }: TeamLogoProps) => {
  // Ensure `logo` is a valid string
  const safeLogo = typeof logo === "string" && logo.trim() !== "" ? logo : null;
  
  // Loading state
  if (isLoading) {
    return (
      <Avatar className="w-[24px] h-[24px]">
        <AvatarFallback>
          <Shield className="w-5 h-5 text-gray-400 animate-pulse" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="w-[24px] h-[24px]">
      <AvatarImage
        src={safeLogo || 'https://picsum.photos/24/24'}
        alt={`${teamName} logo`}
        className="object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://picsum.photos/24/24';
          console.error(`Failed to load team logo: ${safeLogo}`);
        }}
      />
      <AvatarFallback>
        <Shield className="w-5 h-5 text-gray-400" />
      </AvatarFallback>
    </Avatar>
  );
};

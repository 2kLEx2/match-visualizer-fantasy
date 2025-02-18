
import React from 'react';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  logo?: string;
  teamName: string;
  isLoading: boolean;
  isLoaded: boolean;
}

export const TeamLogo = ({ logo, teamName, isLoading, isLoaded }: TeamLogoProps) => {
  if (!logo || (!isLoaded && !isLoading)) {
    return (
      <div className="w-[24px] h-[24px] flex items-center justify-center">
        <Shield className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-[24px] h-[24px] flex items-center justify-center">
        <Shield className="w-5 h-5 text-gray-400 animate-pulse" />
      </div>
    );
  }

  return (
    <img 
      src={logo}
      alt={`${teamName} logo`}
      className="w-[24px] h-[24px] object-contain"
    />
  );
};

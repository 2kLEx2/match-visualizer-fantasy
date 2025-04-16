
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Match } from '@/lib/api/matches';
import { Upload } from 'lucide-react';

interface CustomMatchFormProps {
  onAddMatch: (match: Match) => void;
}

export const CustomMatchForm = ({ onAddMatch }: CustomMatchFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    time: '',
    team1Name: '',
    team2Name: '',
    tournament: '',
    team1Logo: '',
    team2Logo: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, teamNumber: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        [`team${teamNumber}Logo`]: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.team1Name || !formData.team2Name) {
      toast({
        title: "Missing Information",
        description: "Please fill in time and team names",
        variant: "destructive",
      });
      return;
    }

    const customMatch: Match = {
      id: Date.now().toString(),
      time: formData.time,
      team1: {
        name: formData.team1Name,
        logo: formData.team1Logo,
      },
      team2: {
        name: formData.team2Name,
        logo: formData.team2Logo,
      },
      tournament: formData.tournament,
      date: new Date().toISOString(),
    };

    onAddMatch(customMatch);
    setFormData({
      time: '',
      team1Name: '',
      team2Name: '',
      tournament: '',
      team1Logo: '',
      team2Logo: '',
    });

    toast({
      title: "Success",
      description: "Custom match has been added",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg p-4 bg-white/5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="time">Match Time</Label>
          <Input
            id="time"
            placeholder="HH:MM"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            className="bg-white/5 border-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tournament">Tournament Name</Label>
          <Input
            id="tournament"
            placeholder="Tournament"
            value={formData.tournament}
            onChange={(e) => setFormData(prev => ({ ...prev, tournament: e.target.value }))}
            className="bg-white/5 border-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="team1">Team 1</Label>
          <div className="space-y-2">
            <Input
              id="team1"
              placeholder="Team 1 Name"
              value={formData.team1Name}
              onChange={(e) => setFormData(prev => ({ ...prev, team1Name: e.target.value }))}
              className="bg-white/5 border-0"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('team1Logo')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              <input
                id="team1Logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 1)}
              />
              {formData.team1Logo && (
                <img
                  src={formData.team1Logo}
                  alt="Team 1 Logo"
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="team2">Team 2</Label>
          <div className="space-y-2">
            <Input
              id="team2"
              placeholder="Team 2 Name"
              value={formData.team2Name}
              onChange={(e) => setFormData(prev => ({ ...prev, team2Name: e.target.value }))}
              className="bg-white/5 border-0"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => document.getElementById('team2Logo')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              <input
                id="team2Logo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 2)}
              />
              {formData.team2Logo && (
                <img
                  src={formData.team2Logo}
                  alt="Team 2 Logo"
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Add Custom Match
      </Button>
    </form>
  );
};

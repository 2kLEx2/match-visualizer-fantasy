
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomEntry {
  id: string;
  time: string;
  title: string;
}

interface CustomEntriesListProps {
  entries: CustomEntry[];
  onRemoveEntry: (id: string) => void;
}

export const CustomEntriesList = ({ entries, onRemoveEntry }: CustomEntriesListProps) => {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-white/80">Custom Entries:</h3>
      {entries.map((entry) => (
        <div 
          key={entry.id}
          className="rounded-md overflow-hidden bg-[#1B2028]/90 transition-all duration-300 hover:bg-slate-800/50 backdrop-blur-sm"
        >
          <div className="px-3 py-2 grid grid-cols-[70px,1fr,auto] gap-4 items-center">
            <span className="text-base font-medium text-gray-400">{entry.time}</span>
            <span className="text-base font-medium text-white">{entry.title}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveEntry(entry.id)}
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

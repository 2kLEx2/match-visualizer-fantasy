
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomEntry {
  id: string;
  time: string;
  title: string;
}

interface CustomEntryFormProps {
  newEntry: CustomEntry;
  onEntryChange: (entry: CustomEntry) => void;
  onAddEntry: () => void;
}

export const CustomEntryForm = ({ newEntry, onEntryChange, onAddEntry }: CustomEntryFormProps) => {
  return (
    <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-end">
      <div>
        <Input
          type="text"
          value={newEntry.time}
          onChange={(e) => onEntryChange({ ...newEntry, time: e.target.value })}
          placeholder="Time (e.g., 19:00)"
          className="bg-transparent border-white/20"
        />
      </div>
      <div>
        <Input
          type="text"
          value={newEntry.title}
          onChange={(e) => onEntryChange({ ...newEntry, title: e.target.value })}
          placeholder="Title"
          className="bg-transparent border-white/20"
        />
      </div>
      <Button
        onClick={onAddEntry}
        variant="outline"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

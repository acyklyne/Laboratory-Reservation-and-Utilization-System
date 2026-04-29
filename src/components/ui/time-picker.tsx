'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time24: string;
  time12: string;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 7; hour < 22; hour++) {
    for (const minute of [0, 30]) {
      const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const time12 = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
      slots.push({ time24, time12 });
    }
  }
  // Add 10:00 PM (22:00)
  slots.push({ time24: '22:00', time12: '10:00 PM' });
  return slots;
}

const timeSlots = generateTimeSlots();

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = timeSlots.find((t) => t.time24 === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-11',
            !value && 'text-muted-foreground'
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {selected ? selected.time12 : 'Select time'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="max-h-[200px] overflow-y-auto">
          {timeSlots.map((slot) => (
            <div
              key={slot.time24}
              role="button"
              tabIndex={0}
              className={cn(
                'w-full px-3 py-2 text-left text-sm cursor-pointer',
                'hover:bg-accent hover:text-accent-foreground transition-colors',
                value === slot.time24 && 'bg-accent text-accent-foreground font-medium'
              )}
              onClick={() => {
                onChange(slot.time24);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onChange(slot.time24);
                  setOpen(false);
                }
              }}
            >
              {slot.time12}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

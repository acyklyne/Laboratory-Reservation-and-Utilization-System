'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Lab {
  id: string;
  name: string;
}

interface DateGroup {
  date: string;
  slots: Reservation[];
}

export function LabScheduleDialog({ lab, open, onOpenChange }: {
  lab: Lab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !lab?.id) return;

    async function fetchSchedule() {
      try {
        const res = await fetch(`/api/reservations/public?labId=${lab.id}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } catch (error) {
        console.error('Fetch lab schedule error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [open, lab?.id]);

  const dateGroups: DateGroup[] = [];
  const grouped = reservations.reduce<Record<string, Reservation[]>>((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {});

  Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, slots]) => {
      dateGroups.push({
        date,
        slots: slots.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      });
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {lab.name} - Schedule
          </DialogTitle>
          <DialogDescription>
            Approved reservations for this laboratory
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : dateGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved reservations for this lab yet.
            </div>
          ) : (
            <div className="space-y-4">
              {dateGroups.map((group) => (
                <div key={group.date} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{group.date}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {group.slots.length} slots taken
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {group.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary/20 rounded-md text-sm"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

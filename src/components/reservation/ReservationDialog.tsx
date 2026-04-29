'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lab } from '@/types/lab';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TimePicker } from '@/components/ui/time-picker';

const reservationSchema = z.object({
  date: z.date({ required_error: 'Date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  purpose: z.string().min(3, 'Purpose must be at least 3 characters'),
});

type ReservationForm = z.infer<typeof reservationSchema>;

export function ReservationDialog({ lab, children }: { lab: Lab; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
  });

  const dateValue = watch('date');
  const startTimeValue = watch('startTime');
  const endTimeValue = watch('endTime');

  // Check availability when date or time changes
  useEffect(() => {
    if (!dateValue || !startTimeValue || !endTimeValue) {
      setAvailability(null);
      return;
    }

    const checkAvailability = async () => {
      setChecking(true);
      try {
        const formattedDate = format(dateValue, 'yyyy-MM-dd');
        const res = await fetch(
          `/api/availability?labId=${lab.id}&date=${formattedDate}`
        );
        const data = await res.json();

        if (data.error) {
          setAvailability({ available: false, message: data.error });
          return;
        }

        // Check if the selected time slot is available
        const slot = data.availableSlots?.find(
          (s: any) => s.start === startTimeValue && s.end === endTimeValue
        );

        if (slot?.available) {
          setAvailability({ available: true, message: 'Available!' });
        } else {
          setAvailability({ available: false, message: 'This slot is already reserved' });
        }
      } catch {
        setAvailability({ available: false, message: 'Unable to check availability' });
      } finally {
        setChecking(false);
      }
    };

    checkAvailability();
  }, [dateValue, startTimeValue, endTimeValue, lab.id]);

  const onSubmit = async (data: ReservationForm) => {
    setLoading(true);
    try {
      const formattedDate = format(data.date, 'yyyy-MM-dd');
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labId: lab.id,
          date: formattedDate,
          startTime: data.startTime,
          endTime: data.endTime,
          purpose: data.purpose,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: 'Reservation Failed',
          description: result.error || 'Unable to create reservation',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Reservation Submitted',
        description: `Your request for ${lab.name} is pending approval.`,
      });
      setOpen(false);
      reset();
      setAvailability(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Unable to connect to server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { reset(); setAvailability(null); setShowCalendar(false); } }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Reserve {lab.name}</DialogTitle>
            <DialogDescription>
              Complete the form below to request a time slot. All requests are subject to approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {/* Date Picker */}
            <div className="grid gap-2">
              <Label>Date</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
                    !dateValue && 'text-muted-foreground'
                  )}
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateValue ? format(dateValue, 'PPP') : 'Pick a date'}
                </Button>
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-md shadow-md p-0">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          setValue('date', date);
                          setShowCalendar(false);
                        }
                      }}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </div>
                )}
              </div>
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            {/* Time Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <TimePicker
                  value={startTimeValue || ''}
                  onChange={(time) => setValue('startTime', time)}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <TimePicker
                  value={endTimeValue || ''}
                  onChange={(time) => setValue('endTime', time)}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>

            {/* Availability Status */}
            {checking && (
              <div className="bg-muted/50 border p-3 rounded-lg flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Checking availability...
              </div>
            )}
            {!checking && availability && (
              <div className={cn(
                'border p-3 rounded-lg flex items-center gap-3 text-sm',
                availability.available
                  ? 'bg-primary/10 border-primary/20 text-primary'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              )}>
                {availability.available
                  ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                  : <XCircle className="h-5 w-5 shrink-0" />}
                <p>{availability.message}</p>
              </div>
            )}

            {/* Purpose */}
            <div className="grid gap-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="e.g. Senior Project Research"
                className="min-h-[100px]"
                {...register('purpose')}
              />
              {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 text-sm text-yellow-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>Note: Reservations are restricted to operating hours (7:00 AM - 10:00 PM).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setOpen(false); reset(); setAvailability(null); setShowCalendar(false); }}>Cancel</Button>
            <Button type="submit" disabled={loading || (availability !== null && !availability.available)}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

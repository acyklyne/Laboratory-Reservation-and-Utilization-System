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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

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
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [validEndTimes, setValidEndTimes] = useState<string[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm<ReservationForm>({
    resolver: zodResolver(reservationSchema),
  });

  const dateValue = watch('date');
  const startTimeValue = watch('startTime');
  const endTimeValue = watch('endTime');

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setAvailability(null);
      setShowCalendar(false);
      setAvailableSlots([]);
      setUnavailableDates(new Set());
    }
  }, [open, reset]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!dateValue) {
      setAvailability(null);
      setAvailableSlots([]);
      setValue('startTime', '');
      setValue('endTime', '');
      return;
    }

    const fetchAvailableSlots = async () => {
      setChecking(true);
      try {
        const formattedDate = format(dateValue, 'yyyy-MM-dd');
        const res = await fetch(`/api/availability?labId=${lab.id}&date=${formattedDate}`);
        const data = await res.json();

        if (data.error) {
          setAvailability({ available: false, message: data.error });
          setAvailableSlots([]);
          return;
        }

        const slots: TimeSlot[] = data.availableSlots || [];
        setAvailableSlots(slots);
        setAvailability(null);
      } catch {
        setAvailability({ available: false, message: 'Unable to check availability' });
        setAvailableSlots([]);
      } finally {
        setChecking(false);
      }
    };

    fetchAvailableSlots();
  }, [dateValue, lab.id, setValue]);

  // Check if all 30-min slots within the selected range are available
  useEffect(() => {
    if (!dateValue || !startTimeValue || !endTimeValue || availableSlots.length === 0) {
      setAvailability(null);
      return;
    }

    // Generate all 30-min slot start times within the selected range
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startMin = timeToMinutes(startTimeValue);
    const endMin = timeToMinutes(endTimeValue);

    if (endMin <= startMin) {
      setAvailability({ available: false, message: 'End time must be after start time' });
      return;
    }

    // Check every 30-min slot that overlaps the selected range
    let current = startMin;
    let allAvailable = true;
    while (current < endMin) {
      const slotStart = `${Math.floor(current / 60).toString().padStart(2, '0')}:${(current % 60).toString().padStart(2, '0')}`;
      const next = current + 30;
      const slotEnd = `${Math.floor(next / 60).toString().padStart(2, '0')}:${(next % 60).toString().padStart(2, '0')}`;

      const slot = availableSlots.find(s => s.start === slotStart && s.end === slotEnd);
      if (!slot || !slot.available) {
        allAvailable = false;
        break;
      }
      current = next;
    }

    if (allAvailable) {
      setAvailability({ available: true, message: 'Available!' });
    } else {
      setAvailability({ available: false, message: 'This slot is already reserved' });
    }
  }, [startTimeValue, endTimeValue, availableSlots, dateValue]);

  // Fetch unavailable dates for the visible calendar month
  useEffect(() => {
    if (!open || !lab.id) return;

    const fetchUnavailableDates = async () => {
      try {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth() + 1;
        const res = await fetch(
          `/api/availability?labId=${lab.id}&month=${year}-${month.toString().padStart(2, '0')}`
        );
        const data = await res.json();
        if (data.unavailableDates) {
          setUnavailableDates(new Set(data.unavailableDates));
        }
      } catch (error) {
        console.error('Failed to fetch unavailable dates:', error);
      }
    };

    fetchUnavailableDates();
  }, [open, lab.id, calendarMonth]);

  // Compute valid end times based on start time and available slots
  useEffect(() => {
    if (!startTimeValue || availableSlots.length === 0) {
      setValidEndTimes([]);
      return;
    }

    const timeToMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startMin = timeToMin(startTimeValue);
    const valid: string[] = [];

    for (const slot of availableSlots) {
      if (slot.start <= startTimeValue) continue;
      // Check if all slots from startTime to this slot's end are available
      const endMin = timeToMin(slot.end);
      let rangeAvailable = true;
      for (let t = startMin; t < endMin; t += 30) {
        const s = Math.floor(t / 60).toString().padStart(2, '0');
        const m = (t % 60).toString().padStart(2, '0');
        const e = Math.floor((t + 30) / 60).toString().padStart(2, '0');
        const em = ((t + 30) % 60).toString().padStart(2, '0');
        const found = availableSlots.find(x => x.start === `${s}:${m}` && x.end === `${e}:${em}`);
        if (!found || !found.available) {
          rangeAvailable = false;
          break;
        }
      }
      if (rangeAvailable) {
        valid.push(slot.end);
      }
    }

    setValidEndTimes(valid);
  }, [startTimeValue, availableSlots]);

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
        credentials: 'include',
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
    <Dialog open={open} onOpenChange={setOpen}>
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
                  <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-md shadow-lg p-0">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(date) => {
                        if (date) {
                          setValue('date', date);
                          setShowCalendar(false);
                          // Check if date is fully booked
                          const dateStr = format(date, 'yyyy-MM-dd');
                          if (unavailableDates.has(dateStr)) {
                            setAvailability({ available: false, message: 'This date is fully booked. Please choose another date.' });
                          }
                        }
                      }}
                      initialFocus
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return unavailableDates.has(dateStr);
                      }}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      showOutsideDays={false}
                      className="rounded-md border"
                      classNames={{
                        day_disabled: 'opacity-40 cursor-not-allowed bg-muted line-through',
                        cell: 'h-9 w-9 text-center text-sm p-0 relative',
                        day: 'h-9 w-9 p-0 font-normal',
                      }}
                    />
                    {unavailableDates.size > 0 && (
                      <div className="px-3 pb-2 text-xs text-muted-foreground border-t">
                        Greyed out dates are fully booked
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            {/* Time Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select
                  value={startTimeValue}
                  onValueChange={(time) => { setValue('startTime', time); setValue('endTime', ''); }}
                  disabled={!dateValue || checking || availableSlots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!dateValue ? 'Select date first' : checking ? 'Checking...' : 'Select start time'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-48 overflow-y-auto">
                    {availableSlots.map(slot => (
                      <SelectItem
                        key={slot.start}
                        value={slot.start}
                        disabled={!slot.available}
                        className={!slot.available ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        <span className="flex items-center gap-2">
                          {slot.start} - {slot.end}
                          {!slot.available && <span className="text-xs text-destructive">(unavailable)</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select
                  value={endTimeValue}
                  onValueChange={(time) => setValue('endTime', time)}
                  disabled={!startTimeValue || checking || availableSlots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!startTimeValue ? 'Select start time first' : 'Select end time'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-48 overflow-y-auto">
                    {availableSlots
                      .filter(slot => slot.start >= (startTimeValue || '00:00'))
                      .map(slot => {
                        const isAvailable = validEndTimes.includes(slot.end);
                        return (
                          <SelectItem
                            key={slot.end}
                            value={slot.end}
                            disabled={!isAvailable}
                            className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <span className="flex items-center gap-2">
                              {slot.end}
                              {!isAvailable && <span className="text-xs text-destructive">(unavailable)</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
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
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || (availability !== null && !availability.available)}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


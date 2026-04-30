'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, CalendarDays, Building2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PublicReservation {
  id: string;
  lab: { id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
}

interface LabGroup {
  labId: string;
  labName: string;
  dates: DateGroup[];
}

interface DateGroup {
  date: string;
  times: TimeSlot[];
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export default function AllReservationsPage() {
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<string>('all-labs');
  const [selectedDate, setSelectedDate] = useState<string>('all-dates');

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await fetch('/api/reservations/public', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } catch (error) {
        console.error('Fetch public reservations error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, []);

  const { labGroups, uniqueDates, uniqueLabs } = useMemo(() => {
    let filtered = reservations;

    if (selectedLab !== 'all-labs') {
      filtered = filtered.filter((r) => r.lab.id === selectedLab);
    }

    if (selectedDate !== 'all-dates') {
      filtered = filtered.filter((r) => r.date === selectedDate);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) => r.lab?.name?.toLowerCase().includes(q));
    }

    const labMap = new Map<string, Map<string, TimeSlot[]>>();

    filtered.forEach((res) => {
      if (!labMap.has(res.lab.id)) {
        labMap.set(res.lab.id, new Map());
      }
      const dateMap = labMap.get(res.lab.id)!;
      if (!dateMap.has(res.date)) {
        dateMap.set(res.date, []);
      }
      dateMap.get(res.date)!.push({
        id: res.id,
        startTime: res.startTime,
        endTime: res.endTime,
      });
    });

    const groups: LabGroup[] = [];
    labMap.forEach((dateMap, labId) => {
      const labName = filtered.find((r) => r.lab.id === labId)?.lab.name || 'Unknown';
      const dates: DateGroup[] = [];
      dateMap.forEach((times, date) => {
        times.sort((a, b) => a.startTime.localeCompare(b.startTime));
        dates.push({ date, times });
      });
      dates.sort((a, b) => a.date.localeCompare(b.date));
      groups.push({ labId, labName, dates });
    });

    groups.sort((a, b) => a.labName.localeCompare(b.labName));

    const dates = Array.from(new Set(filtered.map((r) => r.date))).sort();
    const labs = Array.from(new Set(filtered.map((r) => r.lab.id)))
      .map((id) => {
        const res = filtered.find((r) => r.lab.id === id);
        return { id, name: res?.lab.name || 'Unknown' };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return { labGroups: groups, uniqueDates: dates, uniqueLabs: labs };
  }, [reservations, search, selectedLab, selectedDate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Lab Schedule</h1>
        <p className="text-muted-foreground">View all approved laboratory reservations organized by laboratory.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-card border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-headline flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              All Reservations
            </CardTitle>
            <CardDescription>Approved reservations across all laboratories.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by lab name..."
                className="pl-10 bg-secondary/50 border-none h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={selectedLab} onValueChange={setSelectedLab}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-secondary/50 border-none">
                <SelectValue placeholder="Filter by lab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-labs">All Laboratories</SelectItem>
                {uniqueLabs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-secondary/50 border-none">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-dates">All Dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reservations...</span>
            </div>
          ) : labGroups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || selectedLab !== 'all-labs' || selectedDate !== 'all-dates'
                ? 'No reservations match your filters.'
                : 'No approved reservations yet.'}
            </div>
          ) : (
            <div className="space-y-6">
              {labGroups.map((labGroup) => (
                <div key={labGroup.labId} className="border rounded-lg overflow-hidden">
                  <div className="bg-secondary/30 px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{labGroup.labName}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {labGroup.dates.reduce((acc, d) => acc + d.times.length, 0)} slots taken
                      </Badge>
                    </div>
                  </div>
                  <div className="divide-y">
                    {labGroup.dates.map((dateGroup) => (
                      <div key={dateGroup.date} className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{dateGroup.date}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {dateGroup.times.length} slots taken
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {dateGroup.times.map((slot) => (
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

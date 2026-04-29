'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Microscope, CalendarCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ReservationDialog } from '@/components/reservation/ReservationDialog';

interface Lab {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  status: string;
  imageUrl?: string;
}

export default function ReservePage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch('/api/labs');
        if (res.ok) {
          const data = await res.json();
          setLabs(data);
        } else {
          // Fallback: fetch from the old constant or show error
          console.error('Failed to fetch labs');
        }
      } catch (error) {
        console.error('Fetch labs error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLabs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Available Laboratories</h1>
        <p className="text-muted-foreground">Browse through our specialized labs and schedule your session.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <Card key={lab.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={lab.imageUrl || 'https://picsum.photos/seed/lab/600/400'}
                  alt={lab.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  data-ai-hint="laboratory equipment"
                />
                <div className="absolute top-3 right-3">
                  <Badge className={lab.status === 'Available' ? 'bg-primary' : 'bg-destructive'}>
                    {lab.status}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="font-headline text-xl">{lab.name}</CardTitle>
                <CardDescription className="line-clamp-2">{lab.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{lab.capacity || 'N/A'} pax</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Microscope className="h-4 w-4" />
                    <span>Modernized</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <ReservationDialog lab={lab}>
                  <Button className="w-full" disabled={lab.status !== 'Available'}>
                    {lab.status === 'Available' ? (
                      <>
                        <CalendarCheck className="mr-2 h-4 w-4" /> Reserve Now
                      </>
                    ) : (
                      'Unavailable'
                    )}
                  </Button>
                </ReservationDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

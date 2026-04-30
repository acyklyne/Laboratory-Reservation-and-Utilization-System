'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Microscope, CalendarCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { ReservationDialog } from '@/components/reservation/ReservationDialog';
import { LabScheduleDialog } from '@/components/LabScheduleDialog';

interface Lab {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  status: string;
  availabilityStatus?: string;
  imageUrl?: string;
}

const labImageMap: Record<string, string> = {
  'Computer Laboratory 1': '/images/Comlab1.jpg',
  'Computer Laboratory 2': '/images/Comlab2.jpg',
  'Computer Laboratory 3': '/images/Comlab3.jpg',
  'Computer Laboratory 4': '/images/Comlab4.jpg',
  'Computer Laboratory 5': '/images/Comlab5.jpg',
  'Microbiology/Parasitology Lab': '/images/Pncbg.png',
  'WSM Laboratory': '/images/WSM.jpg',
  'Digital/Embedded Laboratory': '/images/DigitalEmbedded.jpg',
  'Electronics Laboratory': '/images/Electronics.jpg',
  'Ergonomics Laboratory': '/images/Ergonomics.jpg',
  'Network Laboratory': '/images/Network.jpg',
};

const getLabImage = (labName: string) => labImageMap[labName] || '/images/Pncbg.png';

export default function ReservePage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLab, setScheduleLab] = useState<Lab | null>(null);
  const [reserveLab, setReserveLab] = useState<Lab | null>(null);

  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch('/api/labs', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setLabs(data);
        } else {
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

  // Handle card click (except when clicking action buttons)
  const handleCardClick = (lab: Lab, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't open schedule dialog if clicking on any button or inside ReservationDialog trigger
    if (target.closest('button') || target.closest('[data-reservation-trigger]')) {
      return;
    }
    setScheduleLab(lab);
  };

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
            <Card 
              key={lab.id} 
              className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group cursor-pointer"
              onClick={(e) => handleCardClick(lab, e)}
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={getLabImage(lab.name)}
                  alt={lab.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  data-ai-hint="laboratory equipment"
                />
                <div className="absolute top-3 right-3">
                  {lab.availabilityStatus === 'Available Today' ? (
                    <Badge className="bg-primary">Available Today</Badge>
                  ) : lab.availabilityStatus === 'Unavailable Today' ? (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">Unavailable Today</Badge>
                  ) : (
                    <Badge className="bg-destructive">{lab.availabilityStatus || lab.status}</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-headline text-xl flex items-center gap-2">
                        {lab.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{lab.description}</CardDescription>
                    </div>
                    {/* View Schedule button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0 hover:bg-transparent hover:text-current focus:ring-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScheduleLab(lab);
                      }}
                    >
                      View Schedule
                    </Button>
                  </div>
                </CardHeader>
              </div>
              
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
              
              <CardFooter className="pt-0" onClick={(e) => e.stopPropagation()}>
                <ReservationDialog lab={lab}>
                  <Button
                    className="w-full"
                    disabled={lab.status !== 'Available'}
                  >
                    {lab.status === 'Available' ? (
                      <>
                        <CalendarCheck className="mr-2 h-4 w-4" /> Reserve Now
                      </>
                    ) : (
                      lab.availabilityStatus || lab.status || 'Unavailable'
                    )}
                  </Button>
                </ReservationDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Lab Schedule Dialog - opens when clicking card or View Schedule button */}
      {scheduleLab && (
        <LabScheduleDialog
          lab={scheduleLab}
          open={!!scheduleLab}
          onOpenChange={(open) => !open && setScheduleLab(null)}
        />
      )}
    </div>
  );
}
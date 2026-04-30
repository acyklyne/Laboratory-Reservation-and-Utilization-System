'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/reservation/StatusBadge';
import { Check, X, Trash2, Mail, Sparkles, Filter, Search, Loader2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Reservation {
  id: string;
  userId: string;
  labId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  user: { name: string; email: string };
  lab: { name: string };
}

export default function AdminReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [pendingAction, setPendingAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [deleteRes, setDeleteRes] = useState<Reservation | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    try {
      const res = await fetch('/api/reservations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReservations(data);
      } else if (res.status === 401) {
        console.error('Unauthorized: Please log in as admin');
      } else {
        console.error('Failed to fetch reservations:', res.status);
      }
    } catch (error) {
      console.error('Fetch reservations error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = (res: Reservation, status: 'APPROVED' | 'REJECTED') => {
    setSelectedRes(res);
    setPendingAction(status);
    setAdminNotes('');
  };

  const handleDelete = (res: Reservation) => {
    setDeleteRes(res);
  };

  const confirmDelete = async () => {
    if (!deleteRes) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reservations/${deleteRes.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        toast({
          title: 'Reservation Deleted',
          description: `Reservation for ${deleteRes.user.name} has been removed.`,
        });
        setDeleteRes(null);
        fetchReservations();
      } else {
        const data = await res.json();
        toast({ title: 'Delete Failed', description: data.error || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Unable to connect to server', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRes) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reservations/${selectedRes.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
        credentials: 'include',
      });

      if (res.ok) {
        toast({
          title: `Reservation ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          description: `Notification sent to ${selectedRes.user.email}.`,
        });
        setSelectedRes(null);
        setAdminNotes('');
        fetchReservations();
      } else {
        const data = await res.json();
        toast({ title: 'Action Failed', description: data.error || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Unable to connect to server', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = search
    ? reservations.filter(
        (r) =>
          r.user.name.toLowerCase().includes(search.toLowerCase()) ||
          r.lab.name.toLowerCase().includes(search.toLowerCase())
      )
    : reservations;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">Reservation Requests</h1>
          <p className="text-muted-foreground">Review and manage lab booking applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" /> Bulk Notify
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-secondary/30 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user or lab..."
              className="pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reservations...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'No reservations match your search.' : 'No reservations yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20 border-none">
                  <TableHead className="font-bold">User</TableHead>
                  <TableHead className="font-bold">Lab Room</TableHead>
                  <TableHead className="font-bold">Date & Time</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((res) => (
                  <TableRow key={res.id} className="group">
                    <TableCell>
                      <div className="font-medium text-foreground">{res.user.name}</div>
                      <div className="text-xs text-muted-foreground">{res.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">{res.lab.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{res.date}</div>
                      <div className="text-xs text-muted-foreground">{res.startTime} - {res.endTime}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={res.status.toLowerCase()} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {res.status === 'PENDING' && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => handleAction(res, 'APPROVED')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleAction(res, 'REJECTED')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(res)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRes} onOpenChange={() => { setSelectedRes(null); setAdminNotes(''); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              <Sparkles className="h-5 w-5 text-primary" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              {selectedRes?.status === 'APPROVED' ? 'Approve' : 'Reject'} reservation for {selectedRes?.user.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes for the user..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRes(null); setAdminNotes(''); }} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmAction((selectedRes?.status === 'PENDING' ? 'APPROVED' : selectedRes?.status) as 'APPROVED' | 'REJECTED')}
              disabled={actionLoading}
              variant={selectedRes?.status === 'REJECTED' ? 'destructive' : 'default'}
            >
              {actionLoading ? 'Processing...' : `Confirm ${selectedRes?.status === 'REJECTED' ? 'Rejection' : 'Approval'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRes} onOpenChange={() => setDeleteRes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the reservation for {deleteRes?.user.name} on {deleteRes?.date}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRes(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={actionLoading}>
              {actionLoading ? 'Deleting...' : 'Delete Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

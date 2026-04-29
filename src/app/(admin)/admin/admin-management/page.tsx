'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Trash2, Loader2, Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Admin {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminManagementPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // New admin form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch current user
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser({ id: data.id });
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    }
    fetchCurrentUser();
  }, []);

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Failed to create admin', description: data.error || 'Please try again', variant: 'destructive' });
        return;
      }

      toast({ title: 'Admin Created!', description: `${name} is now an admin.` });
      setName('');
      setEmail('');
      setPassword('');
      fetchAdmins();
    } catch {
      toast({ title: 'Error', description: 'Unable to connect to server', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveAdmin = async (admin: Admin) => {
    if (admin.id === currentUser?.id) {
      toast({ title: 'Cannot remove yourself', description: 'You cannot remove your own admin account', variant: 'destructive' });
      return;
    }

    if (!confirm(`Are you sure you want to remove admin rights from ${admin.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Failed to remove admin', description: data.error || 'Please try again', variant: 'destructive' });
        return;
      }

      toast({ title: 'Admin Removed', description: `${admin.name} is no longer an admin.` });
      fetchAdmins();
    } catch {
      toast({ title: 'Error', description: 'Unable to connect to server', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Admin Management</h1>
        <p className="text-muted-foreground">Create and manage administrator accounts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Admin Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create New Admin
            </CardTitle>
            <CardDescription>Add a new administrator to the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pnc.edu.ph"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin List */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Current Admins
            </CardTitle>
            <CardDescription>{admins.length} administrator(s) in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No admins found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Name</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="font-medium">{admin.name}</div>
                        {admin.id === currentUser?.id && (
                          <span className="text-xs text-primary">(You)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin)}
                          disabled={admin.id === currentUser?.id}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

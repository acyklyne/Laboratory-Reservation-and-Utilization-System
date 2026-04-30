'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Layers, CheckCircle2, XCircle, TrendingUp, Users, Loader2 } from 'lucide-react';

interface ReportData {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  totalUsers: number;
  labUsage: { name: string; value: number; utilization?: number }[];
  peakHoursData: { hour: string; usage: number }[];
  dailyTrends: { date: string; count: number }[];
  weeklyTrends: { week: string; count: number }[];
  monthlyTrends: { month: string; count: number }[];
  statusDistribution: { status: string; value: number }[];
  timeSlotUsage: { slot: string; count: number }[];
}

const chartConfig = {
  value: { label: 'Reservations' },
  usage: { label: 'Usage' },
  count: { label: 'Count' },
};

const STATUS_COLORS: Record<string, string> = {
  Approved: '#198754',
  Pending: '#ffc107',
  Rejected: '#dc3545',
};

export default function AdminDashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/admin/reports', { credentials: 'include' });
        if (res.ok) {
          const reportData = await res.json();
          setData(reportData);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const stats = [
    { label: 'Total Requests', value: data?.total ?? 0, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Approved', value: data?.approved ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pending', value: data?.pending ?? 0, icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Rejected', value: data?.rejected ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleString('default', { month: 'short' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Admin Analytics</h1>
        <p className="text-muted-foreground">Monitor system utilization and reservation trends across all laboratories.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-2xl font-headline font-bold">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Laboratory Utilization</CardTitle>
              <CardDescription>Most reserved labs in the current period</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.labUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={80} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#198754" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Peak Hours Usage</CardTitle>
              <CardDescription>Average hourly utilization across all labs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.peakHoursData || []}>
                    <defs>
                      <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#198754" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#198754" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="hour" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="usage" stroke="#198754" fillOpacity={1} fill="url(#colorUsage)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Status Distribution</CardTitle>
              <CardDescription>Approved vs Pending vs Rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.statusDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="status"
                      label={({ status, value }) => `${status}: ${value}`}
                    >
                      {(data?.statusDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Daily Trends</CardTitle>
              <CardDescription>Reservations over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(data?.dailyTrends || []).map(d => ({ ...d, date: formatDate(d.date) }))}>
                    <defs>
                      <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="count" stroke="#0d6efd" fillOpacity={1} fill="url(#colorDaily)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Time Slot Usage</CardTitle>
              <CardDescription>Most popular time slots for reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.timeSlotUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="slot" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#6f42c1" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Monthly Trends</CardTitle>
              <CardDescription>Reservation trends over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(data?.monthlyTrends || []).map(d => ({ ...d, month: formatMonth(d.month) }))}>
                    <defs>
                      <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fd7e14" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#fd7e14" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="count" stroke="#fd7e14" fillOpacity={1} fill="url(#colorMonthly)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

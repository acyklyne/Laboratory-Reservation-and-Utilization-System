'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

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

export default function AdminReportsPage() {
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  const handleExport = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['PNC iLab Reserve - Usage Report'],
      [''],
      ['Metric', 'Value'],
      ['Total Requests', data.total],
      ['Total Users', data.totalUsers],
      ['Approved', data.approved],
      ['Pending', data.pending],
      ['Rejected', data.rejected],
      [''],
      ['Report Generated', new Date().toLocaleString()],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sheet 2: Laboratory Utilization
    const labData = [
      ['Laboratory Name', 'Reservations', 'Utilization (%)'],
      ...data.labUsage.map(l => [l.name, l.value, l.utilization || 0]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(labData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Lab Utilization');

    // Sheet 3: Peak Hours
    const peakData = [
      ['Hour', 'Usage Count'],
      ...data.peakHoursData.map(h => [h.hour, h.usage]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(peakData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Peak Hours');

    // Sheet 4: Daily Trends
    const dailyData = [
      ['Date', 'Reservations'],
      ...data.dailyTrends.map(d => [d.date, d.count]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Daily Trends');

    // Sheet 5: Monthly Trends
    const monthlyData = [
      ['Month', 'Reservations'],
      ...data.monthlyTrends.map(m => [m.month, m.count]),
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, ws5, 'Monthly Trends');

    // Sheet 6: Status Distribution
    const statusData = [
      ['Status', 'Count'],
      ...data.statusDistribution.map(s => [s.status, s.value]),
    ];
    const ws6 = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, ws6, 'Status Distribution');

    // Sheet 7: Time Slot Usage
    const slotData = [
      ['Time Slot', 'Count'],
      ...data.timeSlotUsage.map(t => [t.slot, t.count]),
    ];
    const ws7 = XLSX.utils.aoa_to_sheet(slotData);
    XLSX.utils.book_append_sheet(wb, ws7, 'Time Slot Usage');

    // Generate and download
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `PNC_iLab_Report_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">Usage Reports</h1>
          <p className="text-muted-foreground">Detailed analytics and exportable reports for laboratory utilization.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data || loading}>
          <Download className="mr-2 h-4 w-4" /> Export to Excel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Laboratory Utilization
              </CardTitle>
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
              <CardTitle className="font-headline flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Peak Hours Usage
              </CardTitle>
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
              <CardTitle className="font-headline">Daily Trends (Last 7 Days)</CardTitle>
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

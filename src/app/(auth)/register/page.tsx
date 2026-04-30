'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  program: z.string().min(1, 'Please select your program'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const { theme, setTheme } = useTheme();

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          program: data.program,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({ title: 'Registration Failed', description: result.error || 'Please try again', variant: 'destructive' });
        return;
      }

      toast({ title: 'Account Created!', description: 'Redirecting to dashboard...' });
      router.push(result.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch {
      toast({ title: 'Error', description: 'Unable to connect to server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
     <div
    className="min-h-screen flex items-center p-4 md:pl-20 lg:pl-32 relative"
    style={{ backgroundImage: 'url(/images/Pncbg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
  >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2 border-2 border-white/30 rounded-xl p-6 bg-black/20 backdrop-blur-sm">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white/20 mb-2">
            <Image src="/images/pnc.ico" alt="PNC Logo" width={40} height={40} />
          </div>
          <h1 className="text-3xl font-headline font-bold text-white">PNC iLab Reserve</h1>
          <p className="text-white/70">Create your reservation account</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-headline text-center">Get Started</CardTitle>
            <CardDescription className="text-center">Provide your details to register as a student</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">University Email</Label>
                <Input id="email" type="email" placeholder="john@pnc.edu.ph" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program / Course</Label>
                <Select onValueChange={(value: string) => { setValue('program', value); setProgram(value); }}>
                  <SelectTrigger id="program">
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="group-business" disabled className="font-bold text-primary mt-1">CBAA</SelectItem>
                    <SelectItem value="BS in Accountancy">BS in Accountancy</SelectItem>
                    <SelectItem value="BS in Business Administration - Financial Management">BS in Business Administration - Major in Financial Management</SelectItem>
                    <SelectItem value="BS in Business Administration - Marketing Management">BS in Business Administration - Major in Marketing Management</SelectItem>

                    <SelectItem value="group-computing" disabled className="font-bold text-primary mt-1">CCS</SelectItem>
                    <SelectItem value="BS in Information Technology">BS in Information Technology</SelectItem>
                    <SelectItem value="BS in Computer Science">BS in Computer Science</SelectItem>

                    <SelectItem value="group-education" disabled className="font-bold text-primary mt-1">COED</SelectItem>
                    <SelectItem value="Bachelor of Elementary Education">Bachelor of Elementary Education</SelectItem>
                    <SelectItem value="Bachelor of Secondary Education - English">Bachelor of Secondary Education - Major in English</SelectItem>
                    <SelectItem value="Bachelor of Secondary Education - Filipino">Bachelor of Secondary Education - Major in Filipino</SelectItem>
                    <SelectItem value="Bachelor of Secondary Education - Mathematics">Bachelor of Secondary Education - Major in Mathematics</SelectItem>
                    <SelectItem value="Bachelor of Secondary Education - Social Sciences">Bachelor of Secondary Education - Major in Social Sciences</SelectItem>

                    <SelectItem value="group-arts" disabled className="font-bold text-primary mt-1">CAS</SelectItem>
                    <SelectItem value="BS in Psychology">BS in Psychology</SelectItem>

                    <SelectItem value="group-engineering" disabled className="font-bold text-primary mt-1">COE</SelectItem>
                    <SelectItem value="BS in Computer Engineering">BS in Computer Engineering</SelectItem>
                    <SelectItem value="BS in Electronics Engineering">BS in Electronics Commuication Engineering</SelectItem>
                    <SelectItem value="BS in Industrial Engineering">BS in Industrial Engineering</SelectItem>

                    <SelectItem value="group-health" disabled className="font-bold text-primary mt-1">CHAS</SelectItem>
                    <SelectItem value="BS in Nursing">BS in Nursing</SelectItem>
                  </SelectContent>
                </Select>
                {errors.program && <p className="text-sm text-destructive">{errors.program.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

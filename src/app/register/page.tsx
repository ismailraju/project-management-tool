'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [mode, setMode] = useState<'new' | 'join'>('new');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    inviteCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: mode === 'new' ? formData.companyName : undefined,
        inviteCode: mode === 'join' ? formData.inviteCode : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ProjectFlow
          </h1>
          <p className="text-zinc-500 mt-2">Create your account</p>
        </div>

        <Card className="border-zinc-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Get started</CardTitle>
            <CardDescription>
              Create a new organization or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'new' | 'join')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">New Organization</TabsTrigger>
                <TabsTrigger value="join">Join with Code</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <TabsContent value="new" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Organization Name</Label>
                    <Input
                      id="companyName"
                      placeholder="Your Company"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required={mode === 'new'}
                      disabled={loading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="join" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode">Invite Code</Label>
                    <Input
                      id="inviteCode"
                      placeholder="Enter organization slug"
                      value={formData.inviteCode}
                      onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                      disabled={loading}
                    />
                    <p className="text-xs text-zinc-500">
                      Ask your organization admin for the invite code
                    </p>
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    mode === 'new' ? 'Create Organization' : 'Join Organization'
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <span className="text-zinc-500">Already have an account? </span>
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

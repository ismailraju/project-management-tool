'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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
          <p className="text-zinc-500 mt-2">Sign in to your account</p>
        </div>

        <Card className="border-zinc-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-zinc-500">Don&apos;t have an account? </span>
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-100">
              <p className="text-xs text-zinc-500 mb-3">Demo accounts:</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-zinc-50 p-2 rounded">
                  <span className="text-zinc-600">Owner:</span>
                  <code className="text-indigo-600">admin@demo.com / admin123</code>
                </div>
                <div className="flex justify-between bg-zinc-50 p-2 rounded">
                  <span className="text-zinc-600">Manager:</span>
                  <code className="text-indigo-600">manager@demo.com / manager123</code>
                </div>
                <div className="flex justify-between bg-zinc-50 p-2 rounded">
                  <span className="text-zinc-600">Member:</span>
                  <code className="text-indigo-600">member@demo.com / member123</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, className, ...props }, children);
  },
}));

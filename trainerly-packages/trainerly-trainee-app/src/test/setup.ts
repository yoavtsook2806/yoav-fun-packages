import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Fix for webidl-conversions error in jsdom environment
// Provides the missing global that webidl-conversions expects
if (typeof global.Symbol === 'undefined') {
  global.Symbol = Symbol;
}

// Ensure WeakMap is available for webidl-conversions
if (typeof global.WeakMap === 'undefined') {
  global.WeakMap = WeakMap;
}

// Mock URL constructor for jsdom compatibility
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    origin: string;

    constructor(url: string, base?: string) {
      this.href = url;
      this.protocol = 'https:';
      this.host = 'localhost';
      this.hostname = 'localhost';
      this.port = '';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
      this.origin = 'https://localhost';
    }

    toString() {
      return this.href;
    }
  } as any;
}

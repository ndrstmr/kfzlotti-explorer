/**
 * Tests for PWA utilities and hooks
 * Tests device detection, install prompts, and online status
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  isPwaInstalled,
  isIos,
  isIosSafari,
  isAndroid,
  useOnlineStatus,
  useInstallPrompt,
  registerServiceWorker,
} from './pwa';

describe('PWA Library', () => {
  describe('isPwaInstalled', () => {
    it('should return true when display-mode is standalone', () => {
      globalThis.window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        }));

      expect(isPwaInstalled()).toBe(true);
    });

    it('should return true for iOS standalone mode', () => {
      globalThis.window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(globalThis.window.navigator, 'standalone', {
        value: true,
        writable: true,
        configurable: true,
      });

      expect(isPwaInstalled()).toBe(true);
    });

    it('should return false when not installed', () => {
      globalThis.window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      // Ensure standalone is also false
      Object.defineProperty(globalThis.window.navigator, 'standalone', {
        value: false,
        writable: true,
        configurable: true,
      });

      expect(isPwaInstalled()).toBe(false);
    });
  });

  describe('isIos', () => {
    it('should detect iPhone', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(true);
    });

    it('should detect iPad', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(true);
    });

    it('should detect iPod', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 12_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(true);
    });

    it('should return false for Android', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(false);
    });

    it('should return false for desktop', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(false);
    });

    it('should handle case-insensitive detection', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (IPHONE; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isIos()).toBe(true);
    });
  });

  describe('isIosSafari', () => {
    it('should detect iOS Safari', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        writable: true,
        configurable: true,
      });

      expect(isIosSafari()).toBe(true);
    });

    it('should return false for iOS Chrome', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/87.0.4280.77 Mobile/15E148 Safari/604.1',
        writable: true,
        configurable: true,
      });

      expect(isIosSafari()).toBe(false);
    });

    it('should return false for iOS Firefox', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/29.0 Mobile/15E148 Safari/605.1.15',
        writable: true,
        configurable: true,
      });

      expect(isIosSafari()).toBe(false);
    });

    it('should return false for Android Safari', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) Safari/537.36',
        writable: true,
        configurable: true,
      });

      expect(isIosSafari()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('should detect Android', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F)',
        writable: true,
        configurable: true,
      });

      expect(isAndroid()).toBe(true);
    });

    it('should return false for iOS', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isAndroid()).toBe(false);
    });

    it('should return false for desktop', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
        configurable: true,
      });

      expect(isAndroid()).toBe(false);
    });

    it('should handle case-insensitive detection', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; ANDROID 10; SM-G973F)',
        writable: true,
        configurable: true,
      });

      expect(isAndroid()).toBe(true);
    });
  });

  describe('useOnlineStatus', () => {
    it('should return current online status', () => {
      Object.defineProperty(globalThis.window.navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toBe(true);
    });

    it('should update when going offline', async () => {
      Object.defineProperty(globalThis.window.navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toBe(true);

      // Simulate going offline
      act(() => {
        Object.defineProperty(globalThis.window.navigator, 'onLine', {
          value: false,
          writable: true,
          configurable: true,
        });
        globalThis.window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should update when going online', async () => {
      Object.defineProperty(globalThis.window.navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toBe(false);

      // Simulate going online
      act(() => {
        Object.defineProperty(globalThis.window.navigator, 'onLine', {
          value: true,
          writable: true,
          configurable: true,
        });
        globalThis.window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('useInstallPrompt', () => {
    it('should initially return false for canInstall', () => {
      const { result } = renderHook(() => useInstallPrompt());

      expect(result.current.canInstall).toBe(false);
      expect(result.current.isInstalled).toBe(false);
    });

    it('should set canInstall to true after beforeinstallprompt event', async () => {
      const { result } = renderHook(() => useInstallPrompt());

      // Simulate beforeinstallprompt event
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        prompt: vi.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        globalThis.window.dispatchEvent(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.canInstall).toBe(true);
      });
    });

    it('should detect iOS', () => {
      Object.defineProperty(globalThis.window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useInstallPrompt());

      expect(result.current.isIos).toBe(true);
    });

    it('should set isInstalled to true after appinstalled event', async () => {
      const { result } = renderHook(() => useInstallPrompt());

      act(() => {
        globalThis.window.dispatchEvent(new Event('appinstalled'));
      });

      await waitFor(() => {
        expect(result.current.isInstalled).toBe(true);
      });
    });

    it('should return false from promptInstall when no deferred prompt', async () => {
      const { result } = renderHook(() => useInstallPrompt());

      const installed = await result.current.promptInstall();

      expect(installed).toBe(false);
    });

    it('should call prompt() when promptInstall is called', async () => {
      const { result } = renderHook(() => useInstallPrompt());

      const mockPrompt = vi.fn();
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        globalThis.window.dispatchEvent(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.canInstall).toBe(true);
      });

      let installed: boolean = false;
      await act(async () => {
        installed = await result.current.promptInstall();
      });

      expect(mockPrompt).toHaveBeenCalled();
      expect(installed).toBe(true);
    });

    it('should return false when user dismisses install', async () => {
      const { result } = renderHook(() => useInstallPrompt());

      const mockPrompt = vi.fn();
      const mockEvent = new Event('beforeinstallprompt');
      Object.assign(mockEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });

      act(() => {
        globalThis.window.dispatchEvent(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.canInstall).toBe(true);
      });

      let installed: boolean = true;
      await act(async () => {
        installed = await result.current.promptInstall();
      });

      expect(installed).toBe(false);
    });
  });

  describe('registerServiceWorker', () => {
    it('should return null if service workers not supported', async () => {
      const originalServiceWorker = navigator.serviceWorker;
      // @ts-expect-error - Testing missing service worker
      delete navigator.serviceWorker;

      const registration = await registerServiceWorker();

      expect(registration).toBeNull();

      // Restore
      Object.defineProperty(navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
        configurable: true,
      });
    });

    it('should register service worker successfully', async () => {
      const mockRegister = vi.fn().mockResolvedValue({
        scope: '/',
        active: null,
        installing: null,
        waiting: null,
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: mockRegister,
        },
        writable: true,
        configurable: true,
      });

      const registration = await registerServiceWorker();

      expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
      expect(registration).toBeTruthy();
      expect(registration?.scope).toBe('/');
    });

    it('should return null on registration error', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: mockRegister,
        },
        writable: true,
        configurable: true,
      });

      const registration = await registerServiceWorker();

      expect(registration).toBeNull();
    });
  });
});

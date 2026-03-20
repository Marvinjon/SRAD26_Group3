import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '@/contexts/auth-context';

let ctx: ReturnType<typeof useAuth> | null = null;

function AuthConsumer() {
  ctx = useAuth();
  return null;
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('AuthProvider', () => {
  beforeEach(async () => {
    ctx = null;
    await AsyncStorage.clear();
  });

  it('registers and logs in a user (expected case)', async () => {
    await act(async () => {
      renderer.create(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );
      await flushPromises();
    });

    await act(async () => {
      await ctx?.register('Ada Lovelace', 'ada@ru.is', 'secret1', 'student');
      await flushPromises();
    });

    expect(ctx?.user?.email).toBe('ada@ru.is');

    await act(async () => {
      await ctx?.logout();
      await flushPromises();
    });

    expect(ctx?.user).toBeNull();

    await act(async () => {
      await ctx?.login('ada@ru.is', 'secret1');
      await flushPromises();
    });

    expect(ctx?.user?.email).toBe('ada@ru.is');
  });

  it('rejects invalid email and short password (boundary/invalid)', async () => {
    await act(async () => {
      renderer.create(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );
      await flushPromises();
    });

    await expect(
      ctx?.register('Bad Email', 'bad@gmail.com', 'secret1', 'student'),
    ).rejects.toThrow();

    await expect(
      ctx?.register('Short Pass', 'short@ru.is', '123', 'student'),
    ).rejects.toThrow();
  });

  it('rejects duplicate registration and wrong password (failure cases)', async () => {
    await act(async () => {
      renderer.create(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>,
      );
      await flushPromises();
    });

    await act(async () => {
      await ctx?.register('Grace Hopper', 'grace@ru.is', 'secret1', 'student');
      await flushPromises();
    });

    await expect(
      ctx?.register('Grace Hopper', 'grace@ru.is', 'secret1', 'student'),
    ).rejects.toThrow();

    await act(async () => {
      await ctx?.logout();
      await flushPromises();
    });

    await expect(
      ctx?.login('grace@ru.is', 'wrongpass'),
    ).rejects.toThrow();
  });
});

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any).__resetStore();
});

describe('AuthContext – registration', () => {
  it('registers a valid user with @ru.is email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Jón Jónsson', 'jon@ru.is', 'secret123', 'student');
    });

    expect(result.current.user).toEqual({
      name: 'Jón Jónsson',
      email: 'jon@ru.is',
      role: 'student',
    });
  });

  it('rejects registration with non-@ru.is email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.register('Test User', 'test@gmail.com', 'password123', 'student');
      }),
    ).rejects.toThrow('You must use a Reykjavík University email (@ru.is)');

    expect(result.current.user).toBeNull();
  });

  it('rejects registration with password shorter than 6 characters', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.register('Test User', 'test@ru.is', '12345', 'student');
      }),
    ).rejects.toThrow('Password must be at least 6 characters');

    expect(result.current.user).toBeNull();
  });

  it('rejects registration with empty name', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.register('', 'test@ru.is', 'password123', 'student');
      }),
    ).rejects.toThrow('Name is required');
  });

  it('rejects registration with whitespace-only name', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.register('   ', 'test@ru.is', 'password123', 'student');
      }),
    ).rejects.toThrow('Name is required');
  });

  it('rejects duplicate email registration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('First User', 'duplicate@ru.is', 'password123', 'student');
    });

    await expect(
      act(async () => {
        await result.current.register('Second User', 'duplicate@ru.is', 'otherpass1', 'employee');
      }),
    ).rejects.toThrow('An account with this email already exists');
  });

  it('normalizes email to lowercase and trims whitespace', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Test', '  UPPER@RU.IS  ', 'password123', 'student');
    });

    expect(result.current.user?.email).toBe('upper@ru.is');
  });

  it('trims the user name on registration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('  Spaced Name  ', 'trim@ru.is', 'password123', 'student');
    });

    expect(result.current.user?.name).toBe('Spaced Name');
  });

  it('stores the correct role on registration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Therapist', 'doc@ru.is', 'password123', 'therapist');
    });

    expect(result.current.user?.role).toBe('therapist');
  });

  it('persists user to AsyncStorage on registration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Persist Test', 'persist@ru.is', 'password123', 'employee');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_users',
      expect.any(String),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_current_user',
      expect.any(String),
    );

    const storedUser = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'mindtrack_current_user',
      )[1],
    );
    expect(storedUser.email).toBe('persist@ru.is');
  });

  it('accepts exactly 6-character password (boundary)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Boundary', 'boundary@ru.is', '123456', 'student');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('boundary@ru.is');
  });
});

describe('AuthContext – login', () => {
  it('logs in with valid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Login Test', 'login@ru.is', 'mypassword', 'student');
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.login('login@ru.is', 'mypassword');
    });

    expect(result.current.user).toEqual({
      name: 'Login Test',
      email: 'login@ru.is',
      role: 'student',
    });
  });

  it('rejects login with wrong password', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('User', 'wrongpw@ru.is', 'correct1', 'student');
    });
    await act(async () => {
      await result.current.logout();
    });

    await expect(
      act(async () => {
        await result.current.login('wrongpw@ru.is', 'wrong_password');
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects login with non-existent email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login('nonexistent@ru.is', 'anything');
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('normalizes email on login (case-insensitive)', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Case Test', 'casetest@ru.is', 'password1', 'student');
    });
    await act(async () => {
      await result.current.logout();
    });

    await act(async () => {
      await result.current.login('CASETEST@RU.IS', 'password1');
    });

    expect(result.current.user?.email).toBe('casetest@ru.is');
  });
});

describe('AuthContext – logout', () => {
  it('clears user state on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Logout', 'logout@ru.is', 'password1', 'student');
    });

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('removes current user from AsyncStorage on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Remove', 'remove@ru.is', 'password1', 'student');
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mindtrack_current_user');
  });
});

describe('AuthContext – selectTherapist', () => {
  it('sets selectedTherapistId on the user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Student', 'student@ru.is', 'password1', 'student');
    });

    await act(async () => {
      await result.current.selectTherapist('t1');
    });

    expect(result.current.user?.selectedTherapistId).toBe('t1');
  });

  it('updates therapist selection when changed', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Student', 'sel@ru.is', 'password1', 'student');
    });

    await act(async () => {
      await result.current.selectTherapist('t1');
    });
    expect(result.current.user?.selectedTherapistId).toBe('t1');

    await act(async () => {
      await result.current.selectTherapist('t2');
    });
    expect(result.current.user?.selectedTherapistId).toBe('t2');
  });

  it('persists selected therapist to AsyncStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register('Student', 'therapist-sel@ru.is', 'password1', 'student');
    });

    (AsyncStorage.setItem as jest.Mock).mockClear();

    await act(async () => {
      await result.current.selectTherapist('t3');
    });

    const storedUser = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'mindtrack_current_user',
      )[1],
    );
    expect(storedUser.selectedTherapistId).toBe('t3');
  });
});

describe('AuthContext – useAuth outside provider', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});

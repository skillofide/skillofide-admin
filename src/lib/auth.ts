// Auth for the admin panel. We reuse the platform's /api/login. Only role=admin
// is allowed past the login screen; a student/recruiter token is rejected here
// even though the backend would accept it elsewhere.

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return !!getToken() && getUser()?.role === 'admin';
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const resp = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    let msg = 'Failed to authenticate';
    try {
      const body = await resp.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = (await resp.json()) as { token: string; user: AdminUser };
  if (data.user?.role !== 'admin') {
    throw new Error('This account is not an administrator.');
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

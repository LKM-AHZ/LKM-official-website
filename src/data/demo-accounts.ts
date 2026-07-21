import type { DemoUser } from '~/types/auth';

export const VALIDATE_CODE = '000000';

export const DEMO_ACCOUNTS: DemoUser[] = [
  {
    id: 'local-001',
    username: 'demo_local',
    password: '123456',
    level: 'local',
    email: null,
    phone: null,
    has2FA: false,
    hasPasskey: false,
    hasGithub: false,
    bindings: [],
  },
  {
    id: 'normal-001',
    username: 'demo_normal',
    password: '123456',
    level: 'normal',
    email: 'demo@likemi.com',
    phone: '13800138000',
    has2FA: false,
    hasPasskey: false,
    hasGithub: false,
    bindings: ['email', 'phone'],
  },
  {
    id: 'admin-001',
    username: 'demo_admin',
    password: 'Abc@1234',
    level: 'admin',
    email: 'admin@likemi.com',
    phone: '13900139000',
    has2FA: true,
    hasPasskey: false,
    hasGithub: false,
    bindings: ['email', 'phone'],
  },
];

export function findAccount(usernameOrEmailOrPhone: string): DemoUser | undefined {
  const input = usernameOrEmailOrPhone.trim().toLowerCase();
  return DEMO_ACCOUNTS.find(
    (u) => u.username.toLowerCase() === input || u.email?.toLowerCase() === input || u.phone === input
  );
}

export function findAccountByEmail(email: string): DemoUser | undefined {
  const input = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((u) => u.email?.toLowerCase() === input);
}

export function findAccountByPhone(phone: string): DemoUser | undefined {
  return DEMO_ACCOUNTS.find((u) => u.phone === phone.trim());
}

export function checkPassword(user: DemoUser, password: string): boolean {
  return user.password === password;
}

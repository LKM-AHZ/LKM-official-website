// 本地数据及历史备份的类型契约。

export interface Letter {
  id: string;
  status: "scheduled" | "published" | "sealed";
  scheduledAt?: number;
  publishedAt?: number;
  sealUntil?: number;
  scheduledPrivacy?: string;
  privacy?: string;
  [key: string]: unknown;
}

export interface Draft {
  id: string;
  [key: string]: unknown;
}

export interface ReplyMessage {
  id: string;
  recalled?: boolean;
  text: string;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  myLetterId: string;
  peerLetterId: string;
  peerCodename: string;
  myCodename: string;
  messages: ReplyMessage[];
  blocked: boolean;
  updatedAt: number;
}

export interface TreeholeSettings {
  theme: "day" | "night";
  fontScale: "small" | "normal" | "large";
  muted: boolean;
  lowPerf: boolean;
  highContrast: boolean;
  privacyAccepted: boolean;
  accent: string;
  accent2: string;
  rateLimit: number;
  audioOn: boolean;
  notifyDesktop: boolean;
  bgmVolume: number;
}

export interface FavGroup {
  id: string;
  name: string;
  ids: string[];
}

export interface Bottle {
  id: string;
  picked?: boolean;
  ownerId?: string;
  reply?: string;
  repliedAt?: number;
  [key: string]: unknown;
}

export interface Wish {
  id: string;
  lights?: number;
  [key: string]: unknown;
}

export interface MoodRecord {
  month: string;
  mood: string;
  count: number;
}

export interface Sketch {
  id: string;
  dataUrl: string;
  at: number;
}

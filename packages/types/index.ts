export enum Role {
  ADMIN = 'ADMIN',
  TECH_DIRECTOR = 'TECH_DIRECTOR',
  OPERATOR = 'OPERATOR',
  VOLUNTEER = 'VOLUNTEER',
  VIEWER = 'VIEWER',
}

export enum SegmentType {
  WORSHIP_SET = 'WORSHIP_SET',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS',
  SERMON = 'SERMON',
  OFFERING = 'OFFERING',
  CLOSING = 'CLOSING',
  CUSTOM = 'CUSTOM',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  date: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAsset {
  id: string;
  name: string;
  path: string;
  type: string;
  tenantId: string;
  createdAt: Date;
}

export interface AppState {
  timers: {
    segment: { duration: number; remaining: number; running: boolean; type: 'countdown' };
    target: { targetTime: string; remaining: number; running: boolean; type: 'target' };
    elapsed: { seconds: number; running: boolean; type: 'elapsed' };
  };
  currentScene: {
    background: string | null;
    overlayText: string;
    timerVisible: boolean;
    theme: string;
    chromaKey: boolean;
    positions: { timer: string; overlay: string };
  };
}

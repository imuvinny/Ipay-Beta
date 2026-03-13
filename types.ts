import { ReactNode } from 'react';

export type ThemeColor = 'green' | 'pink' | 'blue' | 'purple' | 'orange' | 'cyan';

export interface ThemeStyle {
  base: string;
  bg: string;
  text: string;
  accent: string;
}

export type ThemeMap = Record<ThemeColor, ThemeStyle>;

export interface Transaction {
  id?: string; // Add ID for DB reference
  icon: ReactNode;
  type: string;
  date: string;
  amount: string;
  isCredit: boolean;
  fee?: number;
  commission?: number;
  category?: string; // For icon mapping from DB
  role?: 'client' | 'agent'; // To distinguish dashboards
}

export interface PendingRequest {
  id: string;
  created_at: string;
  agent_id: string;
  client_id: string;
  amount: number;
  agent_name: string;
  client_name: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UserProfile {
  id?: string; // Add ID for DB reference
  email?: string; // Add email for admin check
  role?: 'user' | 'admin'; // Add role for access control
  name: string;
  skinTone: string;
  gender: 'masculine' | 'feminine';
  seed: string;
  style: string;
  fixedHair: string | null;
  noBeard: boolean;
  avatarUrl?: string;
  cardSkin?: {
    background: string;
    pattern: string | null;
    id: string;
  };
  agentStatus?: 'none' | 'pending' | 'approved';
  // Agent Application Details
  fullName?: string;
  idNumber?: string;
  businessName?: string;
  address?: string;
  // Agent Location
  isOnline?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface AvatarPreset {
  id: number;
  name: string;
  seed: string;
  style: string;
  color: string;
  gender: 'masculine' | 'feminine';
  fixedHair?: string;
  noBeard?: boolean;
}
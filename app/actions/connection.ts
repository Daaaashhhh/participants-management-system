'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface ConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  tablesExist: boolean;
  supabaseUrl: string;
  message: string;
}

export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const isConfigured = isSupabaseConfigured();

  if (!isConfigured) {
    if (url.includes('placeholder-project')) {
      return {
        isConfigured: false,
        isConnected: false,
        tablesExist: false,
        supabaseUrl: url,
        message: 'NEXT_PUBLIC_SUPABASE_URL is still set to placeholder-project. Please update it with your real Supabase Project URL in .env.local.',
      };
    }
    return {
      isConfigured: false,
      isConnected: false,
      tablesExist: false,
      supabaseUrl: url,
      message: 'Supabase credentials are not fully configured in .env.local.',
    };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('partner_agencies')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.toLowerCase().includes('does not exist')
      ) {
        return {
          isConfigured: true,
          isConnected: true,
          tablesExist: false,
          supabaseUrl: url,
          message: 'Connected to Supabase, but tables have not been created yet. Please run supabase/schema.sql in the Supabase SQL Editor.',
        };
      }
      return {
        isConfigured: true,
        isConnected: false,
        tablesExist: false,
        supabaseUrl: url,
        message: `Supabase connection error: ${error.message}`,
      };
    }

    return {
      isConfigured: true,
      isConnected: true,
      tablesExist: true,
      supabaseUrl: url,
      message: 'Connected to live Supabase PostgreSQL database!',
    };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      isConfigured: true,
      isConnected: false,
      tablesExist: false,
      supabaseUrl: url,
      message: `Failed to connect: ${errMessage}`,
    };
  }
}


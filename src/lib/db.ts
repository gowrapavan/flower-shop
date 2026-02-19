import fs from 'fs';
import path from 'path';
import { Product, User } from '@/types';
import { supabase } from './supabase'; // Import Supabase

const dataDir = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(fileContents);
  } catch (e) {
    return [];
  }
}

export const db = {
  products: {
    getAll: () => readJSON<Product>('products.json'),
    getById: (id: string) => readJSON<Product>('products.json').find(p => p.id === id),
  },
  
  // Update users to use Async Supabase calls
  users: {
    getByEmail: async (email: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // maybeSingle returns null if not found
      
      if (error || !data) return null;
      return data as User;
    },
    
    create: async (user: User) => {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Create Error:", error);
        throw error;
      }
      return data as User;
    },

    update: async (email: string, updates: Partial<User>) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', email)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase Update Error:", error);
        return null;
      }
      return data as User;
    }
  }
};
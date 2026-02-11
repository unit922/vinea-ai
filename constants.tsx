
import React from 'react';
import { InventoryItem, StaffShift, TrainingSession } from './types';

export const COLORS = {
  primary: '#7c2d12', // Deep Wine
  secondary: '#451a03', // Charcoal/Brown
  accent: '#fbbf24', // Amber/Gold
  bg: '#f8fafc',
  text: '#1e293b'
};

// Added originalPrice to INITIAL_INVENTORY items to match InventoryItem interface
export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Cabernet Sauvignon 2018', category: 'Wine', stock: 12, unit: 'Bottles', minStock: 24, price: 85, originalPrice: 85 },
  { id: '2', name: 'Chardonnay Reserve', category: 'Wine', stock: 45, unit: 'Bottles', minStock: 20, price: 65, originalPrice: 65 },
  { id: '3', name: 'Premium Gin', category: 'Spirit', stock: 8, unit: 'Liters', minStock: 10, price: 45, originalPrice: 45 },
  { id: '4', name: 'Angostura Bitters', category: 'Mixer', stock: 2, unit: 'Bottles', minStock: 5, price: 15, originalPrice: 15 },
  { id: '5', name: 'Craft IPA', category: 'Beer', stock: 120, unit: 'Cans', minStock: 100, price: 6, originalPrice: 6 },
  { id: '6', name: 'Truffle Popcorn', category: 'Snack', stock: 50, unit: 'Servings', minStock: 10, price: 12, originalPrice: 12 },
  { id: '7', name: 'Artisan Olives', category: 'Snack', stock: 30, unit: 'Portions', minStock: 5, price: 9, originalPrice: 9 },
  { id: '8', name: 'Charcuterie Board', category: 'Snack', stock: 15, unit: 'Platters', minStock: 3, price: 28, originalPrice: 28 }
];

// Added accessStatus: 'Active' to meet StaffShift requirement
export const INITIAL_SHIFTS: StaffShift[] = [
  { id: '1', name: 'Jean-Luc S.', role: 'Sommelier', startTime: '17:00', endTime: '23:00', performanceScore: 94, accessStatus: 'Active', assignedModules: [{ moduleId: '1', completed: true }] },
  { id: '2', name: 'Maria G.', role: 'Mixologist', startTime: '18:00', endTime: '01:00', performanceScore: 88, accessStatus: 'Active', assignedModules: [{ moduleId: '2', completed: false }] },
  { id: '3', name: 'Robert D.', role: 'Server', startTime: '17:30', endTime: '22:30', performanceScore: 82, accessStatus: 'Active', assignedModules: [{ moduleId: '3', completed: false }] }
];

export const TRAINING_MODULES: TrainingSession[] = [
  { id: '1', topic: 'Old World vs New World Wines', difficulty: 'Intermediate', duration: '20m', completed: true, category: 'Wine' },
  { id: '2', topic: 'Advanced Mixology: Clarification', difficulty: 'Advanced', duration: '45m', completed: false, category: 'Cocktails' },
  { id: '3', topic: 'The Art of Guest Interaction', difficulty: 'Beginner', duration: '15m', completed: false, category: 'Service' },
  { id: '4', topic: 'Luxury Service Etiquette', difficulty: 'Intermediate', duration: '30m', completed: false, category: 'Service' },
  { id: '5', topic: 'Inventory Management 101', difficulty: 'Intermediate', duration: '25m', completed: false, category: 'Management' },
  { id: '6', topic: 'Spirit Production & Terroir', difficulty: 'Advanced', duration: '40m', completed: false, category: 'Cocktails' }
];

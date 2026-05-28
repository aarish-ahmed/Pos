import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Table from './models/Table.js';
import Category from './models/Category.js';
import MenuItem from './models/MenuItem.js';
import Settings from './models/Settings.js';

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Table.deleteMany(),
    Category.deleteMany(),
    MenuItem.deleteMany(),
    Settings.deleteMany(),
  ]);

  await User.create([
    { name: 'Admin', email: 'admin@pos.com', password: 'admin123', role: 'admin' },
    { name: 'Manager', email: 'manager@pos.com', password: 'manager123', role: 'manager' },
    { name: 'Cashier', email: 'cashier@pos.com', password: 'cashier123', role: 'cashier' },
    { name: 'Waiter', email: 'waiter@pos.com', password: 'waiter123', role: 'waiter' },
  ]);

  const tables = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({
      number: i,
      name: `Table ${i}`,
      capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      zone: i <= 6 ? 'Indoor' : 'Patio',
    });
  }
  await Table.insertMany(tables);

  const categories = await Category.insertMany([
    { name: 'Starters', sortOrder: 1, color: '#7d9d8a' },
    { name: 'Mains', sortOrder: 2, color: '#6b9080' },
    { name: 'Desserts', sortOrder: 3, color: '#a4c3b2' },
    { name: 'Beverages', sortOrder: 4, color: '#81b29a' },
  ]);

  const [starters, mains, desserts, beverages] = categories;

  await MenuItem.insertMany([
    { name: 'Caesar Salad', price: 9.5, category: starters._id, prepTime: 10, tags: ['vegetarian'], image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80' },
    { name: 'Soup of the Day', price: 7.0, category: starters._id, prepTime: 8, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80' },
    { name: 'Bruschetta', price: 8.5, category: starters._id, prepTime: 12, tags: ['vegetarian'], image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=900&q=80' },
    { name: 'Grilled Salmon', price: 24.0, category: mains._id, prepTime: 20, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80' },
    { name: 'Ribeye Steak', price: 32.0, category: mains._id, prepTime: 25, image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80' },
    { name: 'Pasta Primavera', price: 16.5, category: mains._id, prepTime: 18, tags: ['vegetarian'], image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80' },
    { name: 'Chicken Parmesan', price: 18.0, category: mains._id, prepTime: 22, image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=900&q=80' },
    { name: 'Margherita Pizza', price: 14.0, category: mains._id, prepTime: 15, tags: ['vegetarian'], image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=80' },
    { name: 'Chocolate Lava Cake', price: 8.0, category: desserts._id, prepTime: 12, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' },
    { name: 'Tiramisu', price: 7.5, category: desserts._id, prepTime: 5, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=80' },
    { name: 'Espresso', price: 3.5, category: beverages._id, prepTime: 3, image: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=900&q=80' },
    { name: 'Fresh Lemonade', price: 4.5, category: beverages._id, prepTime: 5, image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=900&q=80' },
    { name: 'House Red Wine', price: 9.0, category: beverages._id, prepTime: 2, image: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=900&q=80' },
    { name: 'Iced Tea', price: 3.0, category: beverages._id, prepTime: 3, image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=900&q=80' },
  ]);

  await Settings.create({
    restaurantName: 'Green Leaf Bistro',
    address: '123 Main Street',
    phone: '(555) 123-4567',
    taxRate: 0.08,
    serviceChargeRate: 0.1,
    serviceChargeEnabled: true,
  });

  console.log('Seed complete!');
  console.log('Login: admin@pos.com / admin123');
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

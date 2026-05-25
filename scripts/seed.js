/**
 * Seed script — run once to populate initial data
 *   npm run seed          → seed everything
 *   npm run seed:admin    → admin only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const Menu = require('../src/models/Menu');
const Setting = require('../src/models/Setting');

const ADMIN = {
  username: 'admin',
  email: 'admin@fiahcorner.com',
  password: 'Admin@1234',
  role: 'superadmin',
};

const MENU_ITEMS = [
  { name: 'Pink Latte', category: 'Minuman', price: 32000, emoji: '🌸', description: 'Espresso + steamed milk + pink syrup', featured: true },
  { name: 'Matcha Rose', category: 'Minuman', price: 35000, emoji: '🍵', description: 'Japanese matcha + rose essence', featured: true },
  { name: 'Strawberry Frappe', category: 'Minuman', price: 38000, emoji: '🍓', description: 'Fresh strawberry blended with cream' },
  { name: 'Taro Milk', category: 'Minuman', price: 34000, emoji: '🟣', description: 'Creamy taro + oat milk' },
  { name: 'Butterfly Pea Tea', category: 'Minuman', price: 30000, emoji: '💙', description: 'Blue tea + lemon + honey' },
  { name: 'Caramel Macchiato', category: 'Minuman', price: 36000, emoji: '☕', description: 'Espresso + vanilla + caramel drizzle' },
  { name: 'Sakura Cake', category: 'Makanan', price: 45000, emoji: '🎂', description: 'Moist sakura sponge with cream cheese', featured: true },
  { name: 'Croissant', category: 'Makanan', price: 28000, emoji: '🥐', description: 'Buttery flaky French croissant' },
  { name: 'Waffle Berry', category: 'Makanan', price: 40000, emoji: '🧇', description: 'Crispy waffle + mixed berry compote' },
  { name: 'Sandwich Club', category: 'Makanan', price: 38000, emoji: '🥪', description: 'Triple decker chicken sandwich' },
  { name: 'Macarons (5 pcs)', category: 'Snack', price: 42000, emoji: '🍬', description: 'Assorted French macarons' },
  { name: 'Donat Mini (6 pcs)', category: 'Snack', price: 25000, emoji: '🍩', description: 'Glazed mini donuts' },
  { name: 'Cookies & Cream', category: 'Snack', price: 22000, emoji: '🍪', description: 'Homemade cookies with cream filling' },
];

async function seed() {
  const adminOnly = process.argv.includes('--admin-only');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Admin
    const existing = await Admin.findOne({ username: ADMIN.username });
    if (existing) {
      console.log('  Admin sudah ada, skip.');
    } else {
      await Admin.create(ADMIN);
      console.log(`✓ Admin dibuat: ${ADMIN.username} / ${ADMIN.password}`);
    }

    if (!adminOnly) {
      // Settings
      const settingExists = await Setting.findOne();
      if (!settingExists) {
        await Setting.create({});
        console.log('✓ Settings default dibuat');
      } else {
        console.log('  Settings sudah ada, skip.');
      }

      // Menu
      const menuCount = await Menu.countDocuments();
      if (menuCount === 0) {
        await Menu.insertMany(MENU_ITEMS.map((item, i) => ({ ...item, sortOrder: i })));
        console.log(`✓ ${MENU_ITEMS.length} menu ditambahkan`);
      } else {
        console.log(`  Menu sudah ada (${menuCount} item), skip.`);
      }
    }

    console.log('\n✅ Seed selesai!\n');
    console.log('   Login: POST /api/auth/login');
    console.log(`   Username: ${ADMIN.username}`);
    console.log(`   Password: ${ADMIN.password}\n`);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();

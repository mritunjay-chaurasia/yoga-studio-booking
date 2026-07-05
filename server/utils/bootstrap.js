import crypto from 'crypto';
import User from '../models/User.js';

/**
 * First-time setup for a real studio owner.
 * Empty DB → create studio admin from env.
 */
const bootstrapStudio = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) return;

  const email = process.env.ADMIN_EMAIL || 'owner@yogastudio.com';
  const password =
    process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const name = process.env.ADMIN_NAME || 'Studio Owner';
  const phone = process.env.ADMIN_PHONE || '0000000000';
  const studioId = process.env.STUDIO_ID || 'default';

  await User.create({
    name,
    email,
    phone,
    password,
    role: 'admin',
    studioId,
  });

  console.log('--- Studio ready ---');
  console.log(`Admin login: ${email}`);
  console.log(`Password: ${password}`);
  console.log('Add instructors from Admin → Staff, then create classes.');
  if (!process.env.ADMIN_PASSWORD) {
    console.log('Set ADMIN_PASSWORD in .env to use a fixed password on fresh installs.');
  }
};

export default bootstrapStudio;

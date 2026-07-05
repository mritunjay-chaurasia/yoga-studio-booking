export const validateEnv = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const required = ['MONGODB_URI'];

  if (isProd) {
    required.push('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'CLIENT_URL');
  } else if (!process.env.JWT_SECRET && !process.env.JWT_ACCESS_SECRET) {
    console.warn('Warning: JWT secrets not set — using defaults is unsafe');
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

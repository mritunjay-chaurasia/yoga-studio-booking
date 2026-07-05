import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 7;

const parseExpiryToMs = (exp) => {
  const match = String(exp).match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[match[2]];
};

const ACCESS_MAX_AGE = parseExpiryToMs(ACCESS_EXPIRES);
const REFRESH_MAX_AGE = REFRESH_DAYS * 24 * 60 * 60 * 1000;

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not configured');
  return secret;
};

export const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, getAccessSecret(), { expiresIn: ACCESS_EXPIRES });

export const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE);

  await RefreshToken.create({
    user: userId,
    token: hashToken(token),
    expiresAt,
  });

  return token;
};

export const verifyRefreshToken = async (token) => {
  const doc = await RefreshToken.findOne({
    token: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  return doc;
};

export const revokeRefreshToken = async (token) => {
  if (!token) return;
  await RefreshToken.deleteOne({ token: hashToken(token) });
};

export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};

const cookieOptions = (maxAge) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge,
  };
};

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookie('refreshToken', refreshToken, cookieOptions(REFRESH_MAX_AGE));
};

export const clearAuthCookies = (res) => {
  const opts = { path: '/', httpOnly: true };
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', opts);
};

export const issueAuthTokens = async (res, userId) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = await createRefreshToken(userId);
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};

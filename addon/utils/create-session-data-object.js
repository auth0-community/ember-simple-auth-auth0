import { assign } from '@ember/polyfills';
import now from '../utils/now';

export default function createSessionDataObject(profile, tokenInfo) {
  const sessionData = { issuedAt: now() };
  assign(sessionData, tokenInfo, { profile });
  return sessionData;
}

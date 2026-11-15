// src/lib/vip.js
// membershipLevel IS the VIP level. Every new member starts at VIP 1.
export const vipLevelOf = (membershipLevel) => Math.max(1, Number(membershipLevel) || 1);
export const vipLabel = (vipLevel) => `VIP ${Math.max(1, Number(vipLevel) || 1)}`;

// Members at this VIP level (or higher) can create community posts. Mirrors backend COMMUNITY_POST_MIN_VIP.
export const COMMUNITY_POST_MIN_VIP = 3;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AvatarPalette {
  id: string;
  name: string;
  bgStart: string;
  bgEnd: string;
  textColor: string;
}

export const AVATAR_PALETTES: AvatarPalette[] = [
  { id: "indigo", name: "Indigo Modern", bgStart: "#4f46e5", bgEnd: "#3730a3", textColor: "#ffffff" },
  { id: "emerald", name: "Emerald Fresh", bgStart: "#059669", bgEnd: "#047857", textColor: "#ffffff" },
  { id: "violet", name: "Violet Royal", bgStart: "#7c3aed", bgEnd: "#5b21b6", textColor: "#ffffff" },
  { id: "rose", name: "Rose Sunset", bgStart: "#e11d48", bgEnd: "#9f1239", textColor: "#ffffff" },
  { id: "amber", name: "Amber Warm", bgStart: "#d97706", bgEnd: "#b45309", textColor: "#ffffff" },
  { id: "ocean", name: "Ocean Blue", bgStart: "#0284c7", bgEnd: "#0369a1", textColor: "#ffffff" }
];

export function getInitials(name: string): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates a clean, crisp PNG Data URL avatar based on initials and color palette
 */
export function generateInitialsAvatar(name: string, paletteId: string = "indigo"): string {
  const initials = getInitials(name);
  const palette = AVATAR_PALETTES.find((p) => p.id === paletteId) || AVATAR_PALETTES[0];

  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  // Smooth background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, palette.bgStart);
  gradient.addColorStop(1, palette.bgEnd);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw initials text
  ctx.fillStyle = palette.textColor;
  ctx.font = `bold ${Math.floor(size * 0.42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + size * 0.03);

  return canvas.toDataURL("image/png");
}

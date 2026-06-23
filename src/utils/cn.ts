/**
 * @file cn.ts
 * @description Tailwind CSS class names utility merger.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple CSS class values into a single class string.
 * Uses clsx to resolve conditional class lists and twMerge to handle Tailwind CSS conflicts.
 * 
 * @param inputs - Array of class values, objects, or arrays
 * @returns A consolidated class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

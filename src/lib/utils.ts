import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a human-readable format
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export function formatDate(input: string | number): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: 'KES')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a price
 * @param price The price to format
 * @param options Options for formatting the price
 * @returns Formatted price string
 */
export function formatPrice(
  price: number | string,
  options: {
    currency?: "USD" | "EUR" | "GBP" | "KES"
    notation?: Intl.NumberFormatOptions["notation"]
  } = {}
) {
  const { currency = "KES", notation = "compact" } = options

  const numericPrice = typeof price === "string" ? parseFloat(price) : price

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation,
    maximumFractionDigits: 2,
  }).format(numericPrice)
}

/**
 * Truncate a string to a specified length
 * @param str The string to truncate
 * @param maxLength The maximum length of the string
 * @returns The truncated string with an ellipsis if necessary
 */
export function truncateString(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
}

/**
 * Get the status badge variant based on the status
 * @param status The status to get the variant for
 * @returns The Tailwind classes for the status badge
 */
export function getStatusVariant(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'delivered':
    case 'paid':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'processing':
    case 'shipped':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
    case 'failed':
    case 'refunded':
      return 'bg-red-100 text-red-800';
    case 'inactive':
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

/**
 * Get the absolute URL
 * @param path The path to get the absolute URL for
 * @returns The absolute URL
 */
export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || ""}${path}`
}

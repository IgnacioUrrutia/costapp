/**
 * Utilities for consistent amount parsing and formatting
 */

/**
 * Parses a string amount into a valid number, handling Chilean/European 
 * formatting where '.' is often used as a thousand separator and ',' as decimal.
 * 
 * @param {string|number} value - The raw input value
 * @returns {number} - The cleaned numeric value
 */
export const parseAmount = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Clean common thousand separators (dots or spaces)
  // Example: "22.500,00" -> "22500,00"
  let cleanValue = value.toString().replace(/[.\s]/g, '');

  // Handle commas as decimal separators
  // Example: "22500,50" -> "22500.50"
  cleanValue = cleanValue.replace(',', '.');

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a number to a consistent Chilean currency string (No decimal by default for CLP)
 * 
 * @param {number} value - The number to format
 * @param {string} currency - 'CLP' or 'USD'
 * @returns {string} - Formatted string
 */
export const formatAmount = (value, currency = 'CLP') => {
  if (currency === 'USD') {
    return Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }
  
  return Number(value || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
};

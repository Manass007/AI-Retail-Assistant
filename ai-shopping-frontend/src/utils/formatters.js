import { format } from 'date-fns';

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    return format(new Date(date), formatStr);
  } catch (error) {
    return '';
  }
};

export const formatDaysAgo = (date) => {
  if (!date) return '';
  try {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  } catch (error) {
    return '';
  }
};

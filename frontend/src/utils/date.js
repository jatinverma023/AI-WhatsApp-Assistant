export function formatDate(isoString) {
  if (!isoString) return 'Never Active';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never Active';
    
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Never Active';
  }
}

export function formatRelativeTime(isoString) {
  if (!isoString) return 'Never Active';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Never Active';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return formatDate(isoString).split(',')[0]; // Just the date part
  } catch (error) {
    return 'Never Active';
  }
}

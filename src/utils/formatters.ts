export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function maskToken(token: string): string {
  if (token.length <= 20) return '***';
  return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

export function formatMemoryMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export function formatDiskMB(mb: number): string {
  if (mb >= 1048576) return `${(mb / 1048576).toFixed(0)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

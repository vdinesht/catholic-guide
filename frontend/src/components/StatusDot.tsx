import type { ContentStatus } from '../lib/types';

const LABEL: Record<ContentStatus, string> = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  CHANGES: 'Unpublished changes',
  MISSING: 'Missing',
};

export function statusLabel(s: ContentStatus): string {
  return LABEL[s];
}

/** Filled = published, ring = draft, dashed = missing. Shape, not just colour, carries the meaning. */
export function StatusDot({ status, size = 12, label }: { status: ContentStatus; size?: number; label?: string }) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`status-dot status-${status}`}
      style={{ width: size, height: size }}
    />
  );
}

export function StatusPill({ status }: { status: ContentStatus }) {
  return <span className={`status-pill pill-${status}`}>{LABEL[status]}</span>;
}

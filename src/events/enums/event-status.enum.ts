export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.PENDING]: [EventStatus.PROCESSING],
  [EventStatus.PROCESSING]: [EventStatus.PROCESSED, EventStatus.FAILED],
  [EventStatus.PROCESSED]: [],
  [EventStatus.FAILED]: [EventStatus.PROCESSING],
};

export function isValidEventStatusTransition(
  currentStatus: EventStatus,
  nextStatus: EventStatus,
): boolean {
  return (EVENT_STATUS_TRANSITIONS[currentStatus] ?? []).includes(nextStatus);
}

export function assertValidEventStatusTransition(
  currentStatus: EventStatus,
  nextStatus: EventStatus,
): void {
  if (!isValidEventStatusTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed transitions: ${
        EVENT_STATUS_TRANSITIONS[currentStatus]?.join(', ') ?? 'none'
      }`,
    );
  }
}

package aqms.domain.enums;

/**
 * Lifecycle states for a queue entry.
 */
public enum QueueStatus {
  WAITING, QUEUED, CALLED, SERVING, SKIPPED, COMPLETED
}
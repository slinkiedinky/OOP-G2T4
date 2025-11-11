package aqms.domain.event;

/**
 * Event published when a clinic's queue has advanced (for example when a
 * customer has been called and the head of the queue moved).
 */
public record QueueAdvancedEvent(Long clinicId) {}
package aqms.domain.event;

/**
 * Event emitted when an appointment is rescheduled.
 */
public record AppointmentRescheduledEvent(Long slotId) {}
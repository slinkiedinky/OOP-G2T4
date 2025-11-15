package aqms.domain.event;

/** Event emitted when an appointment is cancelled. */
public record AppointmentCancelledEvent(Long slotId) {}

package aqms.domain.event;

/**
 * Event emitted when an appointment is successfully booked.
 */
public record AppointmentBookedEvent(Long slotId, Long patientId) {}
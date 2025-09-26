package aqms.domain.event;

public record AppointmentBookedEvent(Long slotId, Long patientId) {}
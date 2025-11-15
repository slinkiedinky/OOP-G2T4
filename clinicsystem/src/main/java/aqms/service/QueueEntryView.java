package aqms.service;

import aqms.domain.enums.QueueStatus;
import java.time.LocalDateTime;

/**
 * Read-only view representing a queue entry for presentation layers.
 *
 * This record is used by QueueService to return a compact snapshot of a queue entry's state to
 * APIs and UI code.
 */
public record QueueEntryView(
    Long id,
    Integer queueNumber,
    QueueStatus status,
    Long appointmentId,
    LocalDateTime time,
    Long patientId,
    String patientName,
    String doctorName,
    String room,
    LocalDateTime calledAt,
    LocalDateTime createdAt,
    Boolean fastTracked,
    LocalDateTime fastTrackedAt,
    String fastTrackReason) {}

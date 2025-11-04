package aqms.service;

import aqms.domain.enums.QueueStatus;
import java.time.LocalDateTime;

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
    LocalDateTime createdAt
    , Boolean fastTracked,
    LocalDateTime fastTrackedAt,
    String fastTrackReason
) {}

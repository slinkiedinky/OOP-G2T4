package aqms.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import java.time.LocalDateTime;

public class DoctorScheduleDtos {
    
    public record AddScheduleRequest(
            @NotNull Long doctorId,
            @NotNull @Future LocalDateTime startTime,
            @NotNull @Future LocalDateTime endTime
    ) {}
    
    public record UpdateAvailabilityRequest(
            @NotNull Boolean available
    ) {}
    
    public record ScheduleResponse(
            Long id,
            Long doctorId,
            String doctorName,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Boolean available
    ) {}
}

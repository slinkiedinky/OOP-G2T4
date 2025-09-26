package aqms.web.controller;

import aqms.domain.enums.QueuePriority; import aqms.web.dto.QueueDtos; import aqms.service.*;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.List;

@RestController @RequestMapping("/api/queue") @RequiredArgsConstructor
public class QueueController {
  private final QueueService queue; private final AppointmentService appt;
  @PostMapping("/check-in/{slotId}") public QueueDtos.TicketResponse checkIn(@PathVariable Long slotId,
      @RequestParam(defaultValue="NORMAL") QueuePriority priority){
    appt.checkIn(slotId); var t = queue.createTicket(slotId, priority);
    return new QueueDtos.TicketResponse(t.getNumber(), t.getPosition(), t.getPriority());
  }
  @PostMapping("/{ticketId}/fast-track") public QueueDtos.TicketResponse fast(@PathVariable Long ticketId, @RequestParam QueuePriority priority){
    var t = queue.fastTrack(ticketId, priority); return new QueueDtos.TicketResponse(t.getNumber(), t.getPosition(), t.getPriority());
  }
  @PostMapping("/{clinicId}/next") public QueueDtos.TicketResponse next(@PathVariable Long clinicId){
    var t = queue.callNext(clinicId); return new QueueDtos.TicketResponse(t.getNumber(), t.getPosition(), t.getPriority());
  }
  @GetMapping("/{clinicId}") public List<?> current(@PathVariable Long clinicId){ return queue.currentQueue(clinicId); }
}

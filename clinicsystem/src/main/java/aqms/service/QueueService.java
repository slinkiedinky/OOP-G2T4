package aqms.service;

import aqms.config.AppProperties;
import aqms.domain.enums.*;
import aqms.domain.model.*;
import aqms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor
public class QueueService {
  private final QueueTicketRepository queueRepo;
  private final AppointmentSlotRepository slotRepo;
  private final AppProperties props;

  @Transactional
  public QueueTicket createTicket(Long appointmentId, QueuePriority priority) {
    var slot = slotRepo.findById(appointmentId).orElseThrow();
    var ticket = new QueueTicket();
    ticket.setClinic(slot.getClinic());
    ticket.setAppointment(slot);
    ticket.setNumber("C" + slot.getClinic().getId() + "-" + System.currentTimeMillis());
    int next = queueRepo.findTopByClinicIdOrderByPositionDesc(slot.getClinic().getId()).map(t -> t.getPosition() + 1).orElse(1);
    ticket.setPosition(next);
    ticket.setPriority(priority);
    ticket.setStatus(QueueStatus.WAITING);
    queueRepo.save(ticket);
    if (priority != QueuePriority.NORMAL) fastTrack(ticket.getId(), priority);
    return ticket;
  }

  @Transactional
  public QueueTicket fastTrack(Long ticketId, QueuePriority priority) {
    var t = queueRepo.findById(ticketId).orElseThrow();
    var list = queueRepo.findByClinicIdAndStatusOrderByPositionAsc(t.getClinic().getId(), QueueStatus.WAITING);
    if (list.isEmpty()) return t;

    double frac = switch (priority) {
      case EXPRESS -> props.getQueue().getExpressFraction();
      case EMERGENCY -> props.getQueue().getEmergencyFraction();
      default -> 1.0;
    };
    int newPos = Math.max(1, (int) Math.ceil(list.size() * frac));
    reposition(t, newPos);
    t.setPriority(priority);
    queueRepo.save(t);
    return t;
  }

  @Transactional
  public QueueTicket callNext(Long clinicId) {
    var list = queueRepo.findByClinicIdAndStatusOrderByPositionAsc(clinicId, QueueStatus.WAITING);
    if (list.isEmpty()) throw new IllegalStateException("Queue empty");
    var next = list.getFirst();
    next.setStatus(QueueStatus.CALLED);
    queueRepo.save(next);
    shiftUp(clinicId);
    return next;
  }

  @Transactional(readOnly = true)
  public List<QueueTicket> currentQueue(Long clinicId) {
    return queueRepo.findByClinicIdAndStatusOrderByPositionAsc(clinicId, QueueStatus.WAITING);
  }

  private void reposition(QueueTicket target, int newPos) {
    var clinicId = target.getClinic().getId();
    var list = queueRepo.findByClinicIdAndStatusOrderByPositionAsc(clinicId, QueueStatus.WAITING);
    list.removeIf(x -> x.getId().equals(target.getId()));
    list.add(Math.min(newPos - 1, list.size()), target);
    for (int i=0;i<list.size();i++){ var e=list.get(i); e.setPosition(i+1); queueRepo.save(e); }
  }

  private void shiftUp(Long clinicId) {
    var list = queueRepo.findByClinicIdAndStatusOrderByPositionAsc(clinicId, QueueStatus.WAITING);
    for (int i=0;i<list.size();i++){ var e=list.get(i); e.setPosition(i+1); queueRepo.save(e); }
  }
}

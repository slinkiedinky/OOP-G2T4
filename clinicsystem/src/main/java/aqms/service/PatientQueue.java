
/*
 * This code was generated with the help of Gemini 2.5 Pro, with modifications being made.
 * Make sure you guys fully understand the code that is being generated, 
 * and not just acknowledge that the code is "AI Generated".
 * According to the introduction slides for IS442,
 * You can use AI tools, as long as everyone in the team can explain the code,
 * and not just "AI generated it".
 * Reminder: All work must be the student's own work.
 * Penalties for violation of this policy range from 
 * zero marks for the component assessment
 * to expulsion, depending on the nature of the offence.
 */


package aqms.service;

import java.util.List;

import aqms.domain.model.AppointmentSlot;
import aqms.domain.enums.QueueStatus;
import org.springframework.stereotype.Service;
import aqms.repository.QueueTicketRepository;
import aqms.domain.model.Clinic;
import aqms.domain.enums.QueuePriority;
import org.springframework.transaction.annotation.Transactional;
import aqms.domain.model.QueueTicket;
import org.springframework.beans.factory.annotation.Autowired;




/**
 * Manages the patient queue by using the QueueTicketRepository to interact
 * with the database. This ensures the queue is persistent and uses the
 * position-based logic defined in the repository.
 */
@Service
public class PatientQueue {

    private final QueueTicketRepository ticketRepository;
    private final NotificationService notificationService;

    @Autowired
    public PatientQueue(QueueTicketRepository ticketRepository, NotificationService notificationService) {
        this.notificationService = notificationService;
        this.ticketRepository = ticketRepository;
    }

    /**
     * Step 1: Create a new ticket for an appointment
     * Step 2: Calculate the position in the queue
     * Step 3: Save to the database.
     * These three steps are done without modifying the Patient object.
     *
     * @param appointment The appointment for which to create a ticket.
     * @return The newly created and saved QueueTicket.
     */
    @Transactional
    public QueueTicket addPatientToQueue(AppointmentSlot appointment) {
        Clinic clinic = appointment.getClinic();

        // To determine the next position, we use the repository to locate the last ticket.
        int nextPosition = ticketRepository.findTopByClinicIdOrderByPositionDesc(clinic.getId())
                .map(lastTicket -> lastTicket.getPosition() + 1)
                .orElse(1); // Start at position 1 if the queue is empty.

        // 2. Create a new QueueTicket entity.
        QueueTicket newTicket = new QueueTicket();
        newTicket.setPosition(nextPosition);
        newTicket.setStatus(QueueStatus.WAITING);
        newTicket.setAppointment(appointment);
        newTicket.setClinic(clinic);
        newTicket.setPriority(QueuePriority.NORMAL);
        
        System.out.println("Patient Added: " + appointment.getPatient().getFullName() + ", Position: " + nextPosition);
        
        // 3. Save the new ticket to the database.
        return ticketRepository.save(newTicket);

    }

    /**
     * Finds the next patient to call from the database, prioritizing EMERGENCY tickets.
     *
     * @param clinic The clinic where the queue is being managed.
     */
    @Transactional
    public void callNext(Clinic clinic) {
        // From the repository, retrieve the current list of waiting patients.
        List<QueueTicket> waitingQueue = ticketRepository.findByClinicIdAndStatusOrderByPositionAsc(clinic.getId(), QueueStatus.WAITING);

        // check if the waitingQueue is empty
        if (waitingQueue.size() == 0) {
            // if the waitingQueue is empty, print an empty queue message.
            System.out.println("Empty Queue for clinic: " + clinic.getName());
            return;
        }

        // 2. Find the correct ticket to serve (EMERGENCY first, then by position).
        QueueTicket ticketToServe = waitingQueue.stream()
                .filter(ticket -> ticket.getPriority() == QueuePriority.EMERGENCY)
                .findFirst()
                .orElse(waitingQueue.get(0));
        
        // 3. In the database, update the status of the ticket to CALLED.
        // and then save
        ticketToServe.setStatus(QueueStatus.CALLED);
        QueueTicket saved_ticket = ticketRepository.save(ticketToServe);

        System.out.print("Current Patient: " + saved_ticket.getAppointment().getPatient().getFullName());

        // 4. Notify the user
        notificationService.notifyPatient(
                saved_ticket.getAppointment().getPatient(),
                "You may now walk to the consultation room. This is because your turn has arrived."
        );
    }
}
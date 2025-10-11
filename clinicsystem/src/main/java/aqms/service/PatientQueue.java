
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
 * uses the QueueTicketRepository to communicate with the database
 * and manage the patient queue.
 * this guarantees that the queue employs the position-based logic
 * specified in the repository and is durable.
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
     * create a new appointment ticket in step one.
     * step two: determine where u are in line
     * save the database in step three.
     * da patient object
     *
     * @param appointment da appointment 4 creatio of ticket.
     * @return newly created & saved QueueTicket.
     */
    @Transactional
    public QueueTicket addPatientToQueue(AppointmentSlot appointment) {
        Clinic clinic = appointment.getClinic();

        // make use of repository to determine next position
        int nextPosition = ticketRepository.findTopByClinicIdOrderByPositionDesc(clinic.getId())
                .map(lastTicket -> lastTicket.getPosition() + 1)
                .orElse(1); // queue empty? start at position one!!

        // create new QueueTicket entity
        QueueTicket newTicket = new QueueTicket();
        newTicket.setPosition(nextPosition);
        newTicket.setStatus(QueueStatus.WAITING);
        newTicket.setAppointment(appointment);
        newTicket.setClinic(clinic);
        newTicket.setPriority(QueuePriority.NORMAL);
        
        System.out.println("Patient Added: " + appointment.getPatient().getFullName() + ", Position: " + nextPosition);
        
        // save da new ticket to da database !!
        return ticketRepository.save(newTicket);

    }

    /**
     * who is da next patient to call? we prioritise tickets on EMERGENCY!
     *
     * @param clinic the clinic where the queue is being managed.
     */
    @Transactional
    public void callNext(Clinic clinic) {
        // find da current list of waiting patients
        List<QueueTicket> waitingQueue = ticketRepository.findByClinicIdAndStatusOrderByPositionAsc(clinic.getId(), QueueStatus.WAITING);

        // is da waitingQueue empty?
        if (waitingQueue.size() == 0) {
            // if so, print an empty queue msg

            // System.out.print(clinic.getName());
            System.out.println("Empty Queue for clinic: " + clinic.getName());
            return;
        }

        // what is the correect ticket to serve? remember, EMERGENCY 1st!
        QueueTicket ticketToServe = waitingQueue.stream()
                .filter(ticket -> ticket.getPriority() == QueuePriority.EMERGENCY)
                .findFirst()
                .orElse(waitingQueue.get(0));
        
        // update ticket status to called then save
        ticketToServe.setStatus(QueueStatus.CALLED);
        QueueTicket saved_ticket = ticketRepository.save(ticketToServe);

        // System.out.print(saved_ticket.getAppointment().getPatient().getFullName());
        System.out.print("Current Patient: " + saved_ticket.getAppointment().getPatient().getFullName());

        // let da user know
        notificationService.notifyPatient(
                saved_ticket.getAppointment().getPatient(),
                "You may now walk to the consultation room. This is because your turn has arrived."
        );
    }
}
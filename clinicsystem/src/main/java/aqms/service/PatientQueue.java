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

import java.util.LinkedList;

/**
 * Manages the patient queue in the SingHealth clinic system.
 * This version corrects issues with queue number assignment and tracking.
 */
public class PatientQueue {

    private int last_assigned_number; // integer variable to track the last number given out
    private int currently_serving_number; // integer variable to track the number currently being served
    private final NotificationService notification_service;
    private final LinkedList<Patient> patient_queue;
    private final LinkedList<Patient> emergency_queue;
    

    /**
     * Constructs a new PatientQueue object.
     */
    // initialise variables
    public PatientQueue() {
        this.currently_serving_number = 0;
        this.last_assigned_number = 0;
        this.patient_queue = new LinkedList<>();
        this.emergency_queue = new LinkedList<>();
        this.notification_service = new NotificationService();
    }

    /**
     * Adds a patient to the queue and assigns them a unique, sequential number.
     *
     * @param patient The patient to be added.
     * @return The assigned queue number.
     */
    public int addPatient(Patient patient) {
        last_assigned_number += 1; // Increment to get a new unique number
        patient.setQueueNumber(last_assigned_number);
        patient_queue.add(patient);
        System.out.println("Patient with username " + patient.getUsername() + " has been added to the regular queue. The number is" + last_assigned_number);
        return last_assigned_number;
    }

    /**
     * Calls the next patient, prioritizing the emergency queue.
     * Updates the currently serving number.
     */
    public void callNext() {
        Patient next_patient;

        next_patient = null;

        if (emergency_queue.size() != 0) {
            // Serve from the emergency queue first
            next_patient = emergency_queue.poll();
            System.out.println("Patient with queue number " + next_patient.getQueueNumber() + " is being currently served from the emergency queue.");
        } else if (patient_queue.size() != 0) {
            // If emergency queue is empty, serve from the regular queue
            next_patient = patient_queue.poll();
            System.out.println("Patient with queue number " + next_patient.getQueueNumber() + " is being currently served from the regular queue.");
        } else {
            System.out.println("Both the patient and emergency queues are empty."); // If code goes here, there are no patients to call.
            return;
        }

        // Update the number that is currently being served
        this.currently_serving_number = next_patient.getQueueNumber();
        notification_service.notifyPatient(next_patient, "It's your turn. Please proceed to the consultation room.");

        // Notify the third patient in the regular queue line
        if (patient_queue.size() > 2) {
            // Get the third person in the list (index is 0-based)
            Patient patient_to_notify = patient_queue.get(2);
            notification_service.notifyPatient(patient_to_notify, "Please get ready as there are only three people in front of you.");
        }
    }

    /**
     * Fast-tracks a patient by moving them to the emergency queue.
     * Handles both existing patients and new emergency walk-ins.
     *
     * @param patient The patient to be fast-tracked.
     */
    public void fastTrack(Patient patient) {
        // If the patient doesn't have a number, they are a new walk-in. Assign one.
        if (patient.getQueueNumber() != 0) {
            patient_queue.remove(patient);
        }
        else {
            last_assigned_number += 1;
            patient.setQueueNumber(last_assigned_number);
            System.out.println("New emergency walk-in " + patient.getUsername() + " assigned number #" + patient.getQueueNumber());
        }

        // Add the patient to the emergency queue if they aren't already there.
        // This 'contains' check also relies on the Patient.equals() method.
        if (emergency_queue.contains(patient)) {
            System.out.println("Patient #" + patient.getQueueNumber() + " (" + patient.getUsername() + ") is already in the emergency queue.");
        } else {
            emergency_queue.add(patient);
            System.out.println("Patient #" + patient.getQueueNumber() + " (" + patient.getUsername() + ") has been fast-tracked to the emergency queue.");
        }
    }

    /**
     * Gets the queue number currently being served.
     * @return The current number.
     */
    public int getCurrentlyServingNumber() {
        return currently_serving_number;
    }

    /**
     * Gets the patient's current position in the regular queue line.
     * Note: This is different from their assigned queue number.
     * This method also relies on the Patient.equals() method to find the index.
     *
     * @param patient The patient to find.
     * @return The position in the queue (1-based), or -1 if not found.
     */
    public int getPositionInQueue(Patient patient) {
        int index = patient_queue.indexOf(patient);

        if (index != -1) {
            return (index + 1);
        }
        else {
            return -1;
        }
    }

    // Pauses the queue system
    public void pause() {
        System.out.println("Queue system paused.");
    }

    
    // Starts the queue system
    public void start() {
        System.out.println("Queue system started.");
    }

    
}


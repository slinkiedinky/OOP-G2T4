/*
 * This code was generated with the help of Gemini 2.5 Pro.
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

    private final LinkedList<Patient> patientQueue;
    private final LinkedList<Patient> emergencyQueue;
    private int lastAssignedNumber; // Tracks the last number given out
    private int currentlyServingNumber; // Tracks the number currently being served
    private final NotificationService notificationService;

    /**
     * Constructs a new PatientQueue object.
     */
    public PatientQueue() {
        this.patientQueue = new LinkedList<>();
        this.emergencyQueue = new LinkedList<>();
        this.currentlyServingNumber = 0;
        this.lastAssignedNumber = 0;
        this.notificationService = new NotificationService();
    }

    /**
     * Adds a patient to the queue and assigns them a unique, sequential number.
     *
     * @param patient The patient to be added.
     * @return The assigned queue number.
     */
    public int addPatient(Patient patient) {
        lastAssignedNumber++; // Increment to get a new unique number
        patient.setQueueNumber(lastAssignedNumber);
        patientQueue.add(patient);
        System.out.println("Patient " + patient.getUsername() + " added to Regular queue with number #" + lastAssignedNumber);
        return lastAssignedNumber;
    }

    /**
     * Calls the next patient, prioritizing the emergency queue.
     * Updates the currently serving number.
     */
    public void callNext() {
        Patient nextPatient;

        if (!emergencyQueue.isEmpty()) {
            // Serve from the emergency queue first
            nextPatient = emergencyQueue.poll();
            System.out.println("Calling patient from Emergency queue: #" + nextPatient.getQueueNumber() + " - " + nextPatient.getUsername());
        } else if (!patientQueue.isEmpty()) {
            // If emergency queue is empty, serve from the regular queue
            nextPatient = patientQueue.poll();
            System.out.println("Calling patient from Regular queue: #" + nextPatient.getQueueNumber() + " - " + nextPatient.getUsername());
        } else {
            System.out.println("All queues are empty.");
            return; // No patients to call
        }

        // Update the number that is currently being served
        this.currentlyServingNumber = nextPatient.getQueueNumber();
        notificationService.notifyPatient(nextPatient, "It's your turn. Please proceed to the consultation room.");

        // Notify the patient who is 3rd in the regular queue line
        if (patientQueue.size() >= 3) {
            // Index 2 represents the third person in the list (0, 1, 2)
            Patient patientToNotify = patientQueue.get(2);
            notificationService.notifyPatient(patientToNotify, "You are 3 positions away. Please get ready.");
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
        if (patient.getQueueNumber() == 0) {
            lastAssignedNumber++;
            patient.setQueueNumber(lastAssignedNumber);
            System.out.println("New emergency walk-in " + patient.getUsername() + " assigned number #" + patient.getQueueNumber());
        } else {
            // If patient is already in the regular queue, remove them to avoid double-calling.
            // This line is CRITICAL. It relies on the Patient.equals() method
            // to find the correct patient based on their username, not memory address.
            patientQueue.remove(patient);
        }

        // Add the patient to the emergency queue if they aren't already there.
        // This 'contains' check also relies on the Patient.equals() method.
        if (!emergencyQueue.contains(patient)) {
            emergencyQueue.add(patient);
            System.out.println("Patient #" + patient.getQueueNumber() + " (" + patient.getUsername() + ") has been fast-tracked to the EMERGENCY queue.");
        } else {
            System.out.println("Patient #" + patient.getQueueNumber() + " (" + patient.getUsername() + ") is already in the emergency queue.");
        }
    }

    /**
     * Gets the queue number currently being served.
     * @return The current number.
     */
    public int getCurrentlyServingNumber() {
        return currentlyServingNumber;
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
        int index = patientQueue.indexOf(patient);

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


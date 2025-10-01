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

import java.util.Objects;

/**
 * Represents a patient in the clinic system.
 * This class includes overridden equals() and hashCode() methods, which are
 * essential for searching and removing patients from collections correctly.
 */
public class Patient {
    private final String username;
    private int queueNumber;

    /**
     * Constructs a new Patient.
     * @param username The unique username or identifier for the patient.
     */
    public Patient(String username) {
        this.username = username;
        this.queueNumber = 0; // Default to 0 until assigned by the queue
    }

    // Standard Getters and Setters
    public String getUsername() {
        return username;
    }

    public int getQueueNumber() {
        return queueNumber;
    }

    public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
    }

    /**
     * Overridden equals() method.
     * This is CRUCIAL for methods like List.remove(), List.contains(),
     * and List.indexOf() to work correctly. It tells Java to consider
     * two Patient objects equal if their usernames are the same.
     * Without this, Java would only consider them equal if they were the
     * exact same object in memory.
     *
     * @param o The object to compare against.
     * @return true if the objects are equal, false otherwise.
     */
    @Override
    public boolean equals(Object o) {
        // 1. Check if the object is being compared to itself
        if (this == o) return true;
        // 2. Check if the other object is null or of a different class
        if (o == null || getClass() != o.getClass()) return false;
        // 3. Cast the object and compare the relevant fields (e.g., username)
        Patient patient = (Patient) o;
        return Objects.equals(username, patient.username);
    }

    /**
     * Overridden hashCode() method.
     * The contract requires that if two objects are equal according to equals(),
     * they must have the same hash code. We base the hash code on the
     * same field used in the equals() method (username).
     *
     * @return The hash code for the object.
     */
    @Override
    public int hashCode() {
        return Objects.hash(username);
    }
}



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

import aqms.domain.model.Patient;

// NOTE: The NotificationService class is written by Ng Jin Han, Joshua.
public class NotificationService {
    // send da notification to da respective patient
    public void notifyPatient(Patient patient, String message) {
        // System.out.print(patient.getFullName());
        System.out.println("Notification Sent. Recipient is: " + patient.getFullName() + ": " + message + ".");
    }

}


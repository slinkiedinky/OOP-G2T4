/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

import java.io.*;
import java.util.*;

public class Appointment implements Serializable {
    Patient patient;
    String timeSlot;

    Appointment(Patient patient, String timeSlot) {
        this.patient = patient;
        this.timeSlot = timeSlot;
    }

    public String toString() {
        return patient.name + " (" + patient.id + ") - " + timeSlot;
    }
}

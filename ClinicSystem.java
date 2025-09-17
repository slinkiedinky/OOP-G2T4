/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */


import java.io.*;
import java.util.*;

public class ClinicSystem {
    static Scanner scanner = new Scanner(System.in);
    static List<Appointment> queue = new LinkedList<>();
    static final String FILE_NAME = "Booking.txt";
    static String currentRole = "";

    public static void main(String[] args) {
        loadAppointments();
        login();

        switch (currentRole) {
            case "patient" -> patientMenu();
            case "staff" -> staffMenu();
            case "admin" -> adminMenu();
        }

        saveAppointments();
    }

    static void login() {
        System.out.println("Login to Clinic System");
        System.out.print("Username: ");
        String username = scanner.nextLine().trim();
        System.out.print("Password: ");
        String password = scanner.nextLine().trim();

        if (username.equalsIgnoreCase("patient1") && password.equals("pass123")) {
            currentRole = "patient";
        } else if (username.equalsIgnoreCase("staff1") && password.equals("staff123")) {
            currentRole = "staff";
        } else if (username.equalsIgnoreCase("admin") && password.equals("admin123")) {
            currentRole = "admin";
        } else {
            System.out.println("Invalid credentials. Exiting.");
            System.exit(0);
        }
    }

    static void patientMenu() {
        while (true) {
            System.out.println("\nPatient Menu:\n1. Book Appointment\n2. View Queue\n3. Exit");
            System.out.print("Choose an option: ");
            int choice = scanner.nextInt();
            scanner.nextLine();

            switch (choice) {
                case 1 -> bookAppointment();
                case 2 -> viewQueue();
                case 3 -> {
                    System.out.println("Goodbye!");
                    return;
                }
                default -> System.out.println("Invalid option.");
            }
        }
    }

    static void staffMenu() {
        while (true) {
            System.out.println("\nStaff Menu:\n1. View Queue\n2. Call Next Patient\n3. Exit");
            System.out.print("Choose an option: ");
            int choice = scanner.nextInt();
            scanner.nextLine();

            switch (choice) {
                case 1 -> viewQueue();
                case 2 -> callNextPatient();
                case 3 -> {
                    System.out.println("Goodbye!");
                    return;
                }
                default -> System.out.println("Invalid option.");
            }
        }
    }

    static void adminMenu() {
        while (true) {
            System.out.println("\nAdmin Menu:\n1. View Total Appointments\n2. Clear Queue\n3. Export to CSV\n4. Exit");
            System.out.print("Choose an option: ");
            int choice = scanner.nextInt();
            scanner.nextLine();

            switch (choice) {
                case 1 -> System.out.println("Total appointments: " + queue.size());
                case 2 -> {
                    queue.clear();
                    System.out.println("Queue cleared.");
                }
                case 3 -> exportToCSV();
                case 4 -> {
                    System.out.println("Goodbye!");
                    return;
                }
                default -> System.out.println("Invalid option.");
            }
        }
    }

    static void bookAppointment() {
        System.out.print("Enter patient name: ");
        String name = scanner.nextLine();
        System.out.print("Enter patient ID: ");
        String id = scanner.nextLine();

        System.out.print("Enter appointment hour (0–23): ");
        int hour = scanner.nextInt();
        System.out.print("Enter appointment minute (0–59): ");
        int minute = scanner.nextInt();
        scanner.nextLine();

        String timeSlot = String.format("%02d:%02d", hour, minute);

        Patient patient = new Patient(name, id);
        Appointment appointment = new Appointment(patient, timeSlot);
        queue.add(appointment);

        System.out.println("Appointment booked for " + name + " at " + timeSlot);
        simulateNotification(patient, timeSlot);
    }

    static void viewQueue() {
        if (queue.isEmpty()) {
            System.out.println("Queue is empty.");
        } else {
            System.out.println("Current Queue:");
            for (int i = 0; i < queue.size(); i++) {
                System.out.println((i + 1) + ". " + queue.get(i));
            }
        }
    }

    static void callNextPatient() {
        if (queue.isEmpty()) {
            System.out.println("No patients in queue.");
        } else {
            Appointment next = queue.remove(0);
            System.out.println("Calling: " + next);
            simulateNotification(next.patient, "Now");
        }
    }

    static void simulateNotification(Patient patient, String time) {
        System.out.println("[SMS] Dear " + patient.name + ", your appointment is scheduled at " + time + ".");
        System.out.println("[Email] Confirmation sent to " + patient.id + "@clinicmail.com");
    }

    static void saveAppointments() {
        try (PrintWriter writer = new PrintWriter(new FileWriter(FILE_NAME))) {
            for (Appointment appt : queue) {
                writer.println(appt);
            }
        } catch (IOException e) {
            System.out.println("Error saving to Booking.txt: " + e.getMessage());
        }
    }

    static void loadAppointments() {
        File file = new File(FILE_NAME);
        if (!file.exists()) {
            queue = new LinkedList<>();
            return;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int nameEnd = line.indexOf(" (");
                int idStart = nameEnd + 2;
                int idEnd = line.indexOf(")");
                int timeStart = line.indexOf("- ") + 2;

                String name = line.substring(0, nameEnd);
                String id = line.substring(idStart, idEnd);
                String timeSlot = line.substring(timeStart);

                Patient patient = new Patient(name, id);
                Appointment appointment = new Appointment(patient, timeSlot);
                queue.add(appointment);
            }
        } catch (IOException e) {
            System.out.println("Error loading from Booking.txt: " + e.getMessage());
        }
    }

    static void exportToCSV() {
        try (PrintWriter writer = new PrintWriter(new FileWriter("QueueExport.csv"))) {
            writer.println("Name,ID,TimeSlot");
            for (Appointment appt : queue) {
                writer.printf("%s,%s,%s%n", appt.patient.name, appt.patient.id, appt.timeSlot);
            }
            System.out.println("Queue exported to QueueExport.csv");
        } catch (IOException e) {
            System.out.println("Error exporting to CSV: " + e.getMessage());
        }
    }
}


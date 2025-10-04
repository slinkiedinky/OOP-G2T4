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





import java.util.Objects;

public class Patient {
    private String username;
    private int queueNumber;

     public Patient(String username) {
        this.username = username;
        this.queueNumber = 0; // 0 means not yet assigned a number
     }

     public String getUsername() {
        return username;
     }

     public int getQueueNumber() {
        return queueNumber;
     }

     public void setQueueNumber(int queueNumber) {
        this.queueNumber = queueNumber;
     }

     // Crucial for methods like list.remove(patient) and list.contains(patient)
     @Override
     public boolean equals(Object o) {
          if (this == o) {
              return true;
          }
          else if (o == null || getClass() != o.getClass()) {
              return false;
          }
          else {
          Patient patient = (Patient) o;
          return Objects.equals(username, patient.username);
          }
     }

     @Override
     public int hashCode() {
          return Objects.hash(username);
     }

}

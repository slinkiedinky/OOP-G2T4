package aqms.service;
import aqms.domain.model.UserAccount;
import aqms.domain.enums.UserRole;
import aqms.repository.ClinicRepository;
import aqms.repository.DoctorRepository;
import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {
    private final UserAccountRepository users; 
    private final PasswordEncoder enc; 

    public UserService(UserAccountRepository users, PasswordEncoder enc){
        this.users = users;
        this.enc = enc;
    }
    public List<UserAccount> getAllUsers(UserRole role) { 
        if (role == null){
            return users.findAll();
        }
        return users.findByRole(role); 
    }
    
    public UserAccount createUser(String username, String rawPassword, UserRole role) {
        if ( users.findByUsername(username).isPresent() ) {
            throw new RuntimeException("Username already Exists");
        }
        UserAccount u = new UserAccount();
        u.setUsername(username);
        u.setPasswordHash(rawPassword);
        u.setRole(role);
        u.setEnabled(true);
        return users.save(u);
    } 

    public void deleteUser(Long id){
        users.deleteById(id);
    }

    public UserAccount updateUser(Long id, String username, String rawPassword, UserRole role, Boolean enabled){
        UserAccount u = users.findById(id).orElseThrow(() -> new RuntimeException("User not found!")); 
        if(username != null) u.setUsername(username);
        if(rawPassword != null) u.setPasswordHash(enc.encode(rawPassword));
        if(role != null) u.setRole(role);
        if(enabled != null) u.setEnabled(enabled);
        return users.save(u);
    }

    public UserAccount getUserbyId(Long id){
        return users.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found!")); 
    }
}

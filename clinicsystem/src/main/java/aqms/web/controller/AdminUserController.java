package aqms.web.controller;

import aqms.domain.enums.UserRole; import aqms.domain.model.UserAccount; import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*; import jakarta.validation.constraints.*; import aqms.service.UserService; import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
  private final UserAccountRepository users; private final PasswordEncoder enc; private final UserService userService;
  record CreateReq(@NotBlank String username, @NotBlank String password, @NotBlank String role) {}
  @PreAuthorize("hasRole('ADMIN')") @PostMapping
  public UserAccount create(@RequestBody CreateReq r){
    var u=new UserAccount(); u.setUsername(r.username()); u.setPasswordHash(enc.encode(r.password()));
    u.setRole(UserRole.valueOf(r.role().toUpperCase())); u.setEnabled(true); return users.save(u);
  }

  // public List<UserAccount> getAll(String role){ 
  //   if (role == null){
  //     return null;
  //   }
  //   return userService.getAllUsers(role); 
  // }

  public UserAccount get(Long id){
    return userService.getUserbyId(id);
  }

  public void delete(Long id) {
    userService.deleteUser(id);
  }

  public UserAccount update(Long id, String username, String password, UserRole role){
    if(role == null){
      return null;
    }
    return userService.updateUser(id, username, password, role, null);
  }
}

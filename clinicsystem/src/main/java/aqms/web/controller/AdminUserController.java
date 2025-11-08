package aqms.web.controller;

import aqms.domain.enums.UserRole; import aqms.domain.model.UserAccount; import aqms.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*; import jakarta.validation.constraints.*; import aqms.service.UserService; import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
  private final UserAccountRepository users; private final PasswordEncoder enc; private final UserService userService;
  record CreateReq(@NotBlank String fullname, @NotBlank String password, @NotBlank String role, @NotBlank String email, String contactNum) {}
  record UpdateReq(@NotBlank String fullname, @NotBlank String password, @NotBlank String role, String email, String contactNum) {}
  @PreAuthorize("hasRole('ADMIN')") 

  @PostMapping("/create")
  public UserAccount create(@RequestBody CreateReq r){
    return userService.createUser(r.fullname(), r.password(), UserRole.valueOf(r.role().toUpperCase()), r.email(), r.contactNum());
    // var u=new UserAccount(); u.setUsername(r.username()); u.setPasswordHash(enc.encode(r.password()));
    // u.setRole(UserRole.valueOf(r.role().toUpperCase())); u.setEnabled(true); return users.save(u);
  }

  @GetMapping("/all")
  public List<UserAccount> getAll(@RequestParam(required=false) UserRole role) {
    return userService.getAllUsers(role);
  }

  @GetMapping("/{id}")
  public UserAccount get(@PathVariable Long id){
    return userService.getUserbyId(id);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id) {
    userService.deleteUser(id);
  }

  @PutMapping("/{id}")
  public UserAccount update(@PathVariable Long id, @RequestBody UpdateReq r){
    return userService.updateUser(id, r.fullname(), r.password(), r.role(), null, r.email(), r.contactNum());
  }

  // @PostMapping("/{id}/resetpassword")
  // public ResponseEntity<?> sendPasswordReset(@PathVariable Long id) {
  //   userService.sendPasswordResetEmail(id);
  //   return ResponseEntity.ok("Password reset email sent.");
  // }
}

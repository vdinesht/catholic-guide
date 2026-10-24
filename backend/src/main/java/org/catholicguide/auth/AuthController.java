package org.catholicguide.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import org.catholicguide.users.User;
import org.catholicguide.users.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final SessionCookies cookies;
    private final CurrentUser currentUser;
    private final UserRepository users;

    public AuthController(AuthService auth, SessionCookies cookies, CurrentUser currentUser, UserRepository users) {
        this.auth = auth;
        this.cookies = cookies;
        this.currentUser = currentUser;
        this.users = users;
    }

    public record CodeRequest(@NotBlank String email) {}

    public record VerifyRequest(@NotBlank String email, String code) {}

    public record Me(Long id, String name, String email, String role) {
        static Me of(User u) {
            return new Me(u.getId(), u.getName(), u.getEmail(), u.getRole().name());
        }
    }

    @PostMapping("/code")
    public ResponseEntity<Void> requestCode(@Validated @RequestBody CodeRequest req) {
        auth.requestCode(req.email());
        return ResponseEntity.status(HttpStatus.ACCEPTED).build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Me> verify(@Validated @RequestBody VerifyRequest req) {
        AuthService.IssuedSession s = auth.verify(req.email(), req.code());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookies.create(s.token(), s.lifetime()).toString())
                .body(Me.of(s.user()));
    }

    @PostMapping("/sign-out")
    public ResponseEntity<Void> signOut(HttpServletRequest request) {
        cookies.read(request).ifPresent(auth::signOut);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
    }

    @GetMapping("/me")
    public Me me() {
        return users.findById(currentUser.principal().userId()).map(Me::of).orElseThrow();
    }
}

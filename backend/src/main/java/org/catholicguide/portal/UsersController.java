package org.catholicguide.portal;

import java.util.List;
import org.catholicguide.auth.CurrentUser;
import org.catholicguide.portal.PortalDtos.UserDto;
import org.catholicguide.users.User;
import org.catholicguide.users.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin only (see SecurityConfig). */
@RestController
@RequestMapping("/api/portal/users")
public class UsersController {

    private final UserService users;
    private final CurrentUser currentUser;

    public UsersController(UserService users, CurrentUser currentUser) {
        this.users = users;
        this.currentUser = currentUser;
    }

    public record InviteRequest(String name, String email, User.Role role) {}

    public record UpdateRequest(User.Role role, User.Status status) {}

    @GetMapping
    public List<UserDto> list() {
        return users.all().stream().map(this::dto).toList();
    }

    @PostMapping
    public UserDto invite(@RequestBody InviteRequest req) {
        return dto(users.invite(req.name(), req.email(), req.role()));
    }

    @PutMapping("/{id}")
    public UserDto update(@PathVariable Long id, @RequestBody UpdateRequest req) {
        return dto(users.update(id, req.role(), req.status()));
    }

    @PostMapping("/{id}/resend-invite")
    public UserDto resend(@PathVariable Long id) {
        return dto(users.resendInvite(id));
    }

    private UserDto dto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getStatus().name(),
                u.getLastSignInAt(), u.getId().equals(currentUser.principal().userId()));
    }
}

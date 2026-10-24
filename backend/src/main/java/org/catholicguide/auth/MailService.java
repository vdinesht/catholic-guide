package org.catholicguide.auth;

import org.catholicguide.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final AppProperties props;

    public MailService(JavaMailSender sender, AppProperties props) {
        this.sender = sender;
        this.props = props;
    }

    public void sendSignInCode(String to, String code, int minutes) {
        send(to, "Your Catholic Guide sign-in code",
                "Your sign-in code is " + code + ".\n\n"
                        + "It works for " + minutes + " minutes. If you didn't try to sign in, you can ignore this email.\n");
    }

    public void sendInvite(String to, String name, String invitedBy) {
        send(to, "You're invited to the Catholic Guide portal",
                "Hello " + name + ",\n\n"
                        + invitedBy + " has invited you to edit readings, prayers and songs on Catholic Guide.\n\n"
                        + "Open " + props.siteUrl() + "/portal/sign-in and enter this email address. "
                        + "There's no password: each time you sign in we'll email you a 6-digit code.\n");
    }

    private void send(String to, String subject, String body) {
        if (!props.mail().enabled()) {
            log.info("Mail disabled — would send to {}: {}\n{}", to, subject, body);
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(props.mail().from());
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        try {
            sender.send(msg);
        } catch (MailException e) {
            // Never reveal delivery problems to the person signing in; the log has the detail.
            log.error("Could not send \"{}\" to {}", subject, to, e);
        }
    }
}

package org.catholicguide.portal;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import org.catholicguide.auth.MailService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * End to end through the API against a real PostgreSQL database (catholic_guide_test, reset per test):
 * sign in with an emailed code, publish a translation, see it on the public site.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PortalFlowTest {

    @Autowired MockMvc mvc;
    @Autowired Flyway flyway;
    @MockitoBean MailService mail;

    @BeforeEach
    void resetDatabase() {
        flyway.clean();
        flyway.migrate();
    }

    private Cookie signIn(String email) throws Exception {
        mvc.perform(post("/api/auth/code").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isAccepted());
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mail).sendSignInCode(eq(email), code.capture(), anyInt());
        return mvc.perform(post("/api/auth/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"code\":\"" + code.getValue() + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("cg_session");
    }

    @Test
    void portalNeedsASession() throws Exception {
        mvc.perform(get("/api/portal/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    void wrongCodeIsRejected() throws Exception {
        mvc.perform(post("/api/auth/code").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"arul.raj@example.org\"}"));
        mvc.perform(post("/api/auth/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"arul.raj@example.org\",\"code\":\"000000\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void editorsCannotManageUsers() throws Exception {
        Cookie editor = signIn("arul.raj@example.org");
        mvc.perform(get("/api/portal/users").cookie(editor)).andExpect(status().isForbidden());
        mvc.perform(get("/api/portal/prayers").cookie(editor)).andExpect(status().isOk());
    }

    @Test
    void publishedTranslationReachesThePublicSiteAndDraftsDoNot() throws Exception {
        // The Tamil readings for 24 October are a draft: visitors get English.
        mvc.perform(get("/api/public/readings/2026-10-24?lang=ta"))
                .andExpect(jsonPath("$.readingsLang").value("en"));

        Cookie admin = signIn("vinoth@genixtec.com");
        mvc.perform(post("/api/portal/readings/2026-10-24/ta/publish").cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sets.ta.status").value("PUBLISHED"));

        mvc.perform(get("/api/public/readings/2026-10-24?lang=ta"))
                .andExpect(jsonPath("$.readingsLang").value("ta"))
                .andExpect(jsonPath("$.readings.parts[0].citation").value("எபேசியர் 4:7–16"));

        mvc.perform(post("/api/portal/readings/2026-10-24/ta/unpublish").cookie(admin)).andExpect(status().isOk());
        mvc.perform(get("/api/public/readings/2026-10-24?lang=ta"))
                .andExpect(jsonPath("$.readingsLang").value("en"));
    }

    @Test
    void songsNeedClearedRightsBeforePublishing() throws Exception {
        Cookie admin = signIn("vinoth@genixtec.com");
        // Song 8 is the Tamil hymn whose rights still need checking.
        mvc.perform(post("/api/portal/songs/8/publish").cookie(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Check the rights to these lyrics before publishing."));
        mvc.perform(get("/api/public/songs/tamil-hymn")).andExpect(status().isNotFound());
    }
}

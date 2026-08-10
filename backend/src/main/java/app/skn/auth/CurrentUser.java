package app.skn.auth;

import app.skn.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUser {
    public static final String SESSION_USER_ID = "SKN_USER_ID";

    private final ObjectProvider<HttpServletRequest> requestProvider;

    public CurrentUser(ObjectProvider<HttpServletRequest> requestProvider) {
        this.requestProvider = requestProvider;
    }

    public long id() {
        return optionalId().orElseThrow(() -> new ApiException(
                HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "로그인이 필요해요."));
    }

    public Optional<Long> optionalId() {
        HttpServletRequest request = requestProvider.getIfAvailable();
        if (request == null) return Optional.empty();
        HttpSession session = request.getSession(false);
        if (session == null) return Optional.empty();
        Object value = session.getAttribute(SESSION_USER_ID);
        return value instanceof Number number ? Optional.of(number.longValue()) : Optional.empty();
    }
}

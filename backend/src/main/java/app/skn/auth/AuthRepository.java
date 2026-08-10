package app.skn.auth;

import app.skn.api.ApiModels.AuthView;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.List;
import java.util.Optional;

import app.skn.api.ApiModels.QuickAccountView;

@Repository
public class AuthRepository {
    private final JdbcTemplate jdbc;

    public AuthRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findCredentials(String username) {
        return jdbc.queryForList("""
                SELECT id, username, password_hash, display_name, is_demo
                  FROM app_user WHERE username = ? COLLATE NOCASE
                """, username).stream().findFirst();
    }

    public Optional<AuthView> findUser(long userId) {
        return jdbc.query("""
                SELECT u.id, u.username, u.display_name, u.is_demo,
                       CASE WHEN o.completed_at IS NULL THEN 0 ELSE 1 END AS onboarding_completed
                  FROM app_user u
                  LEFT JOIN user_onboarding o ON o.user_id = u.id
                 WHERE u.id = ?
                """, (rs, rowNum) -> new AuthView(
                rs.getLong("id"), rs.getString("username"), rs.getString("display_name"),
                rs.getInt("is_demo") == 1,
                rs.getInt("onboarding_completed") == 1
        ), userId).stream().findFirst();
    }

    public List<QuickAccountView> findQuickAccounts() {
        return jdbc.query("""
                SELECT username, display_name
                  FROM app_user
                 WHERE is_demo = 0
                 ORDER BY CASE WHEN username GLOB 'test[0-9][0-9]' THEN 0 ELSE 1 END,
                          id
                """, (rs, rowNum) -> new QuickAccountView(
                rs.getString("username"), rs.getString("display_name")
        ));
    }

    public long insert(String username, String passwordHash, String displayName) {
        Long id = jdbc.queryForObject("""
                INSERT INTO app_user(username, password_hash, display_name, is_demo)
                VALUES (?, ?, ?, 0) RETURNING id
                """, Long.class, username, passwordHash, displayName);
        if (id == null) throw new IllegalStateException("회원 ID를 만들 수 없습니다.");
        return id;
    }

    public void completeOnboarding(long userId, String entryChoice, int selectedProductCount) {
        jdbc.update("""
                INSERT INTO user_onboarding(user_id, entry_choice, selected_product_count, completed_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET
                    entry_choice = excluded.entry_choice,
                    selected_product_count = excluded.selected_product_count,
                    completed_at = excluded.completed_at
                """, userId, entryChoice, selectedProductCount);
    }

    public void delete(long userId) {
        jdbc.update("DELETE FROM app_user WHERE id = ?", userId);
    }
}

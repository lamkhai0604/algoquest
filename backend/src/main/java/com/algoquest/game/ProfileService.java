package com.algoquest.game;

import com.algoquest.access.AccessService;
import com.algoquest.access.UserNotFoundException;
import com.algoquest.game.GameViews.LevelView;
import com.algoquest.game.domain.StreakRules;
import com.algoquest.game.domain.StreakRules.Streak;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The player's profile (FR-12) and daily streak (FR-13). */
@Service
public class ProfileService {

  /** Profile data; per-level progress comes with each level. */
  public record Profile(
      String displayName,
      int totalXp,
      int solvedProblems,
      int currentStreak,
      int bestStreak,
      List<LevelView> levels) {}

  private final AccessService access;
  private final GameService game;
  private final StreakStore streaks;
  private final ProgressStore progress;
  private final Clock clock;

  public ProfileService(
      AccessService access,
      GameService game,
      StreakStore streaks,
      ProgressStore progress,
      Clock clock) {
    this.access = access;
    this.game = game;
    this.streaks = streaks;
    this.progress = progress;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public Profile profile(UUID userId, ZoneId zone) {
    String name = access.findUser(userId).orElseThrow(UserNotFoundException::new).displayName();
    List<LevelView> levels = game.levels(userId);
    int total = levels.stream().mapToInt(LevelView::xp).sum();
    int solved = (int) progress.byProblem(userId).values().stream().filter(p -> p.solved()).count();
    Streak streak = streaks.find(userId);
    LocalDate today = LocalDate.now(clock.withZone(zone));
    return new Profile(
        name, total, solved, StreakRules.current(streak, today), streak.best(), levels);
  }

  /** Counts a solved problem toward the streak. Must run inside the solve's transaction. */
  public void recordSolve(UUID userId, ZoneId zone) {
    Streak before = streaks.lock(userId);
    Streak after = StreakRules.recordSolve(before, LocalDate.now(clock.withZone(zone)));
    if (!after.equals(before)) {
      streaks.save(userId, after);
    }
  }
}

package com.algoquest.content;

import com.algoquest.content.ContentViews.LessonView;
import com.algoquest.content.ContentViews.LevelSummary;
import com.algoquest.content.ContentViews.ProblemSummary;
import com.algoquest.content.ContentViews.ProblemView;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.shared.web.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only content endpoints (FR-02 to FR-04). Lock states and XP are added by the game module
 * (T-203, T-205). Test problems are never served here.
 */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasPermission(null, 'game.play')")
public class ContentController {

  private static final List<String> DIFFICULTY_ORDER = List.of("Easy", "Medium", "Hard");

  private final ContentCatalog catalog;

  public ContentController(ContentCatalog catalog) {
    this.catalog = catalog;
  }

  @GetMapping("/levels")
  public List<LevelSummary> levels() {
    return catalog.levels().stream().map(LevelSummary::of).toList();
  }

  @GetMapping("/levels/{number}/lesson")
  public LessonView lesson(@PathVariable int number) {
    LevelContent level = availableLevel(number);
    return new LessonView(
        number,
        level.info().title(),
        level.lesson().markdown(),
        level.lesson().walkthrough(),
        level.lesson().quickCheck());
  }

  @GetMapping("/levels/{number}/problems")
  public List<ProblemSummary> problems(@PathVariable int number) {
    return availableLevel(number).problems().stream()
        .filter(ContentController::isPractice)
        .sorted(ContentController::byDifficultyThenId)
        .map(ProblemSummary::of)
        .toList();
  }

  @GetMapping("/problems/{id}")
  public ProblemView problem(@PathVariable String id) {
    Problem problem = catalog.problem(id).filter(ContentController::isPractice).orElse(null);
    if (problem == null) {
      throw notFound("Problem not found.");
    }
    return ProblemView.of(problem);
  }

  private LevelContent availableLevel(int number) {
    LevelContent level = catalog.level(number).orElse(null);
    if (level == null || !level.available()) {
      throw notFound("This level has no content yet.");
    }
    return level;
  }

  private static int byDifficultyThenId(Problem a, Problem b) {
    int byDifficulty =
        Integer.compare(
            DIFFICULTY_ORDER.indexOf(a.difficulty()), DIFFICULTY_ORDER.indexOf(b.difficulty()));
    return byDifficulty != 0 ? byDifficulty : a.id().compareTo(b.id());
  }

  private static boolean isPractice(Problem problem) {
    return "practice".equals(problem.use());
  }

  private static ApiException notFound(String detail) {
    return new ApiException(HttpStatus.NOT_FOUND, "Not Found", detail);
  }
}

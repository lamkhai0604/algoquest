package com.algoquest.content;

import com.algoquest.content.model.Example;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.WalkthroughStep;
import java.util.List;
import java.util.Map;

/**
 * What the API returns about content. These views never include answer keys, hints, or hidden tests
 * (NFR-02); they are built field by field, so a new secret field cannot leak by accident.
 */
public final class ContentViews {

  private ContentViews() {}

  public record LevelSummary(
      int number, String slug, String title, String summary, boolean available, int problems) {

    static LevelSummary of(LevelContent level) {
      long practice = level.problems().stream().filter(p -> "practice".equals(p.use())).count();
      return new LevelSummary(
          level.info().number(),
          level.info().slug(),
          level.info().title(),
          level.info().summary(),
          level.available(),
          (int) practice);
    }
  }

  public record LessonView(
      int level,
      String title,
      String markdown,
      List<WalkthroughStep> walkthrough,
      List<QuickCheckQuestion> quickCheck) {}

  public record ProblemSummary(String id, String title, String difficulty, String status) {

    static ProblemSummary of(Problem p) {
      return new ProblemSummary(p.id(), p.title(), p.difficulty(), p.status());
    }
  }

  public record ProblemView(
      String id,
      int level,
      String title,
      String difficulty,
      String status,
      String statement,
      List<Example> examples,
      List<String> constraints,
      Map<String, String> starterCode,
      String similarLeetCode,
      int hintCount) {

    static ProblemView of(Problem p) {
      int hints = p.hints() == null ? 0 : p.hints().size();
      return new ProblemView(
          p.id(),
          p.level(),
          p.title(),
          p.difficulty(),
          p.status(),
          p.statement(),
          p.examples(),
          p.constraints(),
          p.starterCode(),
          p.similarLeetCode(),
          hints);
    }
  }
}

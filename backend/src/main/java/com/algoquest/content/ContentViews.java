package com.algoquest.content;

import com.algoquest.content.model.Example;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.WalkthroughStep;
import java.util.List;
import java.util.Map;

/**
 * What the API may return about content. These views never include answer keys, hints, or hidden
 * tests (NFR-02); they are built field by field, so a new secret field cannot leak by accident.
 */
public final class ContentViews {

  private ContentViews() {}

  public record LessonView(
      int level,
      String title,
      String markdown,
      List<WalkthroughStep> walkthrough,
      List<QuickCheckQuestion> quickCheck) {

    public static LessonView of(LevelContent level) {
      return new LessonView(
          level.info().number(),
          level.info().title(),
          level.lesson().markdown(),
          level.lesson().walkthrough(),
          level.lesson().quickCheck());
    }
  }

  public record ProblemView(
      String id,
      int level,
      String title,
      String difficulty,
      String statement,
      List<Example> examples,
      List<String> constraints,
      Map<String, String> starterCode,
      String similarLeetCode,
      int hintCount) {

    public static ProblemView of(Problem p) {
      int hints = p.hints() == null ? 0 : p.hints().size();
      return new ProblemView(
          p.id(),
          p.level(),
          p.title(),
          p.difficulty(),
          p.statement(),
          p.examples(),
          p.constraints(),
          p.starterCode(),
          p.similarLeetCode(),
          hints);
    }
  }
}

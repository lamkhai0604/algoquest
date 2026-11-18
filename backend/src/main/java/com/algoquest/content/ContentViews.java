package com.algoquest.content;

import com.algoquest.content.model.Example;
import com.algoquest.content.model.Lesson;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.ProblemTranslation;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.WalkthroughStep;
import java.util.ArrayList;
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
      List<QuickCheckQuestion> quickCheck,
      QuickCheckQuestion intuition) {

    public static LessonView of(LevelContent level) {
      return of(level, level.lesson());
    }

    public static LessonView of(LevelContent level, Lesson translated) {
      String title = level.info().title();
      if (translated != level.lesson() && translated.markdown().startsWith("# ")) {
        title = translated.markdown().split("\\R", 2)[0].substring(2).trim();
      }
      return new LessonView(
          level.info().number(),
          title,
          translated.markdown(),
          translated.walkthrough(),
          translated.quickCheck(),
          translated.intuition());
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
      return of(p, null);
    }

    public static ProblemView of(Problem p, ProblemTranslation translated) {
      int hints = p.hints() == null ? 0 : p.hints().size();
      if (translated == null) {
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
      List<Example> examples = new ArrayList<>();
      for (int i = 0; i < p.examples().size(); i++) {
        Example canonical = p.examples().get(i);
        String translation = translated.exampleExplanations().get(i);
        examples.add(
            new Example(
                canonical.input(),
                canonical.output(),
                translation == null || translation.isBlank()
                    ? canonical.explanation()
                    : translation));
      }
      return new ProblemView(
          p.id(),
          p.level(),
          translated.title(),
          p.difficulty(),
          translated.statement(),
          List.copyOf(examples),
          translated.constraints(),
          p.starterCode(),
          p.similarLeetCode(),
          hints);
    }
  }
}

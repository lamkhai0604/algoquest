package com.algoquest.content;

import com.algoquest.content.model.DesignPrompt;
import com.algoquest.content.model.Lesson;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.PatternChallenge;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.ProblemTranslation;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternUtils;
import org.springframework.stereotype.Component;

/**
 * The read-only content catalog, loaded and validated once at startup (D-033). Invalid content
 * stops the application with a list of every problem found.
 */
@Component
public class ContentCatalog {

  private final Map<Integer, LevelContent> levels;
  private final Map<Integer, Lesson> vietnameseLessons;
  private final Map<String, ProblemTranslation> vietnameseProblems;
  private final Map<String, Problem> problemsById = new HashMap<>();
  private final Map<String, PatternChallenge> patternsById = new HashMap<>();
  private final Map<String, DesignPrompt> designsById = new HashMap<>();

  public ContentCatalog(
      ResourceLoader resourceLoader,
      @Value("${algoquest.content.location:classpath:content/}") String location) {
    var resolver = ResourcePatternUtils.getResourcePatternResolver(resourceLoader);
    this.levels = ContentLoader.load(resolver, location);
    this.vietnameseLessons = ContentLoader.loadVietnameseLessons(resolver, location, levels);
    this.vietnameseProblems = ContentLoader.loadVietnameseProblems(resolver, location, levels);
    List<String> duplicates = new ArrayList<>();
    for (LevelContent level : levels.values()) {
      for (Problem problem : level.problems()) {
        if (problemsById.putIfAbsent(problem.id(), problem) != null) {
          duplicates.add("problem id " + problem.id() + " is used by more than one file");
        }
      }
      for (PatternChallenge challenge : level.patterns()) {
        patternsById.putIfAbsent(challenge.id(), challenge);
      }
      for (DesignPrompt design : level.designs()) {
        if (designsById.putIfAbsent(design.id(), design) != null) {
          duplicates.add("design prompt id " + design.id() + " is used by more than one level");
        }
      }
    }
    if (!duplicates.isEmpty()) {
      throw new ContentException(duplicates);
    }
  }

  /** All levels in order, including those with no content yet. */
  public List<LevelContent> levels() {
    return List.copyOf(levels.values());
  }

  public Optional<LevelContent> level(int number) {
    return Optional.ofNullable(levels.get(number));
  }

  /** English is authoritative; untranslated levels fall back to English. */
  public Lesson lesson(int number, String locale) {
    LevelContent level = levels.get(number);
    if (level == null || !level.available()) return null;
    return "vi".equalsIgnoreCase(locale)
        ? vietnameseLessons.getOrDefault(number, level.lesson())
        : level.lesson();
  }

  /** Returns translated public strings only; missing translations use canonical English. */
  public ProblemTranslation problemTranslation(String problemId, String locale) {
    return "vi".equalsIgnoreCase(locale) ? vietnameseProblems.get(problemId) : null;
  }

  /** The full challenge, including its labels. Send labels only after an answer (D-057). */
  public Optional<PatternChallenge> pattern(String id) {
    return Optional.ofNullable(patternsById.get(id));
  }

  /**
   * The full design prompt, including its grading criteria. Send the criteria never, and the
   * reference only after a graded answer (D-085).
   */
  public Optional<DesignPrompt> design(String id) {
    return Optional.ofNullable(designsById.get(id));
  }

  /** The full problem, including its answer key and hidden tests. Never send it to a client. */
  public Optional<Problem> problem(String id) {
    return Optional.ofNullable(problemsById.get(id));
  }
}

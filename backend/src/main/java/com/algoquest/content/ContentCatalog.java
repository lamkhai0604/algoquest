package com.algoquest.content;

import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.Problem;
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
  private final Map<String, Problem> problemsById = new HashMap<>();

  public ContentCatalog(
      ResourceLoader resourceLoader,
      @Value("${algoquest.content.location:classpath:content/}") String location) {
    var resolver = ResourcePatternUtils.getResourcePatternResolver(resourceLoader);
    this.levels = ContentLoader.load(resolver, location);
    List<String> duplicates = new ArrayList<>();
    for (LevelContent level : levels.values()) {
      for (Problem problem : level.problems()) {
        if (problemsById.putIfAbsent(problem.id(), problem) != null) {
          duplicates.add("problem id " + problem.id() + " is used by more than one file");
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

  /** The full problem, including its answer key and hidden tests. Never send it to a client. */
  public Optional<Problem> problem(String id) {
    return Optional.ofNullable(problemsById.get(id));
  }
}

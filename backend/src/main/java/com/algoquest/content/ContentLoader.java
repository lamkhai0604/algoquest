package com.algoquest.content;

import com.algoquest.content.model.Lesson;
import com.algoquest.content.model.LevelContent;
import com.algoquest.content.model.LevelInfo;
import com.algoquest.content.model.Problem;
import com.algoquest.content.model.QuickCheckQuestion;
import com.algoquest.content.model.WalkthroughStep;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Reads the content folder (D-033): the level list, then for each level folder the lesson files and
 * the problem files. Every problem found is reported together, each with its file, and any problem
 * stops the load.
 */
final class ContentLoader {

  private static final JsonMapper JSON =
      JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();

  private final ResourcePatternResolver resolver;
  private final String base;
  private final List<String> problems = new ArrayList<>();

  private ContentLoader(ResourcePatternResolver resolver, String base) {
    this.resolver = resolver;
    this.base = base.endsWith("/") ? base : base + "/";
  }

  /** Loads and validates all content under {@code base}, keyed by level number. */
  static Map<Integer, LevelContent> load(ResourcePatternResolver resolver, String base) {
    ContentLoader loader = new ContentLoader(resolver, base);
    Map<Integer, LevelContent> levels = loader.loadAll();
    if (!loader.problems.isEmpty()) {
      throw new ContentException(loader.problems);
    }
    return levels;
  }

  private Map<Integer, LevelContent> loadAll() {
    List<LevelInfo> infos = read("levels.json", new TypeReference<List<LevelInfo>>() {});
    if (infos == null) {
      return Map.of();
    }
    problems.addAll(ContentValidator.checkLevels(infos));
    Map<String, Resource> files = listFiles();
    Map<Integer, LevelContent> levels = new TreeMap<>();
    for (LevelInfo info : infos) {
      levels.put(info.number(), loadLevel(info, files));
    }
    for (String path : files.keySet()) {
      boolean known = infos.stream().anyMatch(i -> path.startsWith(folder(i)));
      if (!known) {
        problems.add(path + ": file is not inside a level listed in levels.json");
      }
    }
    return levels;
  }

  private LevelContent loadLevel(LevelInfo info, Map<String, Resource> files) {
    String folder = folder(info);
    if (files.keySet().stream().noneMatch(p -> p.startsWith(folder))) {
      return new LevelContent(info, null, List.of());
    }
    String markdown = readText(folder + "lesson.md");
    List<WalkthroughStep> walkthrough =
        read(folder + "walkthrough.json", new TypeReference<List<WalkthroughStep>>() {});
    List<QuickCheckQuestion> quickCheck =
        read(folder + "quick-check.json", new TypeReference<List<QuickCheckQuestion>>() {});
    Lesson lesson = new Lesson(markdown, walkthrough, quickCheck);
    problems.addAll(ContentValidator.checkLesson(folder, lesson));

    List<Problem> levelProblems = new ArrayList<>();
    for (String path : files.keySet()) {
      if (path.startsWith(folder + "problems/") && path.endsWith(".json")) {
        Problem problem = read(path, new TypeReference<Problem>() {});
        if (problem != null) {
          problems.addAll(ContentValidator.checkProblem(path, info.number(), problem));
          levelProblems.add(problem);
        }
      }
    }
    return new LevelContent(info, lesson, List.copyOf(levelProblems));
  }

  static String folder(LevelInfo info) {
    return "levels/" + info.number() + "-" + info.slug() + "/";
  }

  /** Every file under {@code levels/}, keyed by its path relative to the content root. */
  private Map<String, Resource> listFiles() {
    Map<String, Resource> files = new TreeMap<>();
    if (!resolver.getResource(base + "levels/").exists()) {
      return files; // no level has content yet
    }
    try {
      String root = resolver.getResource(base + "levels.json").getURL().toString();
      String prefix = root.substring(0, root.length() - "levels.json".length());
      for (Resource resource : resolver.getResources(base + "levels/**/*")) {
        if (resource.isReadable() && resource.getFilename() != null) {
          String url = resource.getURL().toString();
          if (url.startsWith(prefix) && !url.endsWith("/")) {
            files.put(url.substring(prefix.length()), resource);
          }
        }
      }
    } catch (IOException e) {
      problems.add("levels/: cannot list files (" + e.getMessage() + ")");
    }
    return files;
  }

  private <T> T read(String path, TypeReference<T> type) {
    Resource resource = resolver.getResource(base + path);
    if (!resource.exists()) {
      problems.add(path + ": missing");
      return null;
    }
    try (InputStream in = resource.getInputStream()) {
      return JSON.readValue(in, type);
    } catch (JacksonException | IOException e) {
      problems.add(path + ": " + firstLine(e.getMessage()));
      return null;
    }
  }

  private String readText(String path) {
    Resource resource = resolver.getResource(base + path);
    if (!resource.exists()) {
      problems.add(path + ": missing");
      return null;
    }
    try (InputStream in = resource.getInputStream()) {
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      problems.add(path + ": " + e.getMessage());
      return null;
    }
  }

  private static String firstLine(String message) {
    if (message == null) {
      return "unreadable";
    }
    int end = message.indexOf('\n');
    return end < 0 ? message : message.substring(0, end);
  }
}

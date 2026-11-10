package com.algoquest.content;

import com.algoquest.content.model.LevelContent;
import java.util.Map;
import org.springframework.core.io.support.ResourcePatternResolver;

/** Lets tests in other packages load content without a Spring context. */
public final class ContentTestAccess {

  private ContentTestAccess() {}

  public static Map<Integer, LevelContent> load(ResourcePatternResolver resolver, String base) {
    return ContentLoader.load(resolver, base);
  }
}

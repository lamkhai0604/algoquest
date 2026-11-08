package com.algoquest.game.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/** The game rules stay pure (NFR-10): no framework, persistence, or access-control imports. */
class GameDomainIsolationTest {

  private static final List<String> FORBIDDEN =
      List.of("org.springframework", "jakarta.", "com.algoquest.access", "java.sql");

  @Test
  void gameDomainImportsNoFrameworkOrAccessCode() throws IOException {
    Path sources = Path.of("src/main/java/com/algoquest/game/domain");
    try (Stream<Path> files = Files.list(sources)) {
      for (Path file : files.filter(f -> f.toString().endsWith(".java")).toList()) {
        List<String> imports =
            Files.readAllLines(file).stream().filter(l -> l.startsWith("import ")).toList();
        assertThat(imports)
            .as(file.getFileName().toString())
            .noneMatch(line -> FORBIDDEN.stream().anyMatch(line::contains));
      }
    }
  }
}

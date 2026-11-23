package com.algoquest.notes;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class NoteMarkdownTest {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  private static String markdown(String content) {
    return NoteMarkdown.of(
        "Title", List.of(), null, JSON.readTree("{\"type\":\"doc\",\"content\":[" + content + "]}"));
  }

  private static String text(String value, String marks) {
    return "{\"type\":\"text\",\"text\":\"" + value + "\"" + (marks.isEmpty() ? "" : ",\"marks\":[" + marks + "]") + "}";
  }

  @Test
  void marksBecomeMarkdown() {
    String paragraph =
        "{\"type\":\"paragraph\",\"content\":["
            + text("bold", "{\"type\":\"bold\"}") + "," + text(" ", "") + ","
            + text("lean", "{\"type\":\"italic\"}") + "," + text(" ", "") + ","
            + text("under", "{\"type\":\"underline\"}") + "," + text(" ", "") + ","
            + text("x = 1", "{\"type\":\"code\"}") + "," + text(" ", "") + ","
            + text("site", "{\"type\":\"link\",\"attrs\":{\"href\":\"https://example.com\"}}") + ","
            + text(" a*b_c", "")
            + "]}";
    assertThat(markdown(paragraph))
        .isEqualTo(
            "# Title\n\n**bold** *lean* <u>under</u> `x = 1` [site](https://example.com)"
                + " a\\*b\\_c\n");
  }

  @Test
  void blocksBecomeMarkdown() {
    String doc =
        "{\"type\":\"heading\",\"attrs\":{\"level\":3},\"content\":[" + text("Steps", "") + "]},"
            + "{\"type\":\"orderedList\",\"attrs\":{\"start\":1},\"content\":["
            + "{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":["
            + text("one", "") + "]},{\"type\":\"bulletList\",\"content\":["
            + "{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":["
            + text("inner", "") + "]}]}]}]},"
            + "{\"type\":\"listItem\",\"content\":[{\"type\":\"paragraph\",\"content\":["
            + text("two", "") + "]}]}]},"
            + "{\"type\":\"codeBlock\",\"attrs\":{\"language\":\"java\"},\"content\":["
            + text("int a = 1;\\nint b = 2;", "") + "]},"
            + "{\"type\":\"blockquote\",\"content\":[{\"type\":\"paragraph\",\"content\":["
            + text("quote", "") + "]}]},"
            + "{\"type\":\"horizontalRule\"}";
    assertThat(markdown(doc))
        .isEqualTo(
            "# Title\n\n### Steps\n\n1. one\n   - inner\n2. two\n\n"
                + "```java\nint a = 1;\nint b = 2;\n```\n\n> quote\n\n---\n");
  }

  @Test
  void fileNamesAreSafeSlugs() {
    assertThat(NoteService.fileName("Đồ thị: BFS & DFS!")).isEqualTo("do-thi-bfs-dfs");
    assertThat(NoteService.fileName("../../etc/passwd")).isEqualTo("etc-passwd");
    assertThat(NoteService.fileName("???")).isEqualTo("note");
  }
}

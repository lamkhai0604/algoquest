package com.algoquest.notes;

import java.util.List;
import tools.jackson.databind.JsonNode;

/**
 * Turns an editor document (the JSON the notes editor saves) into Markdown for the export (D-074).
 * Covers the editor's nodes: paragraphs, headings, bullet and numbered lists, code blocks, quotes,
 * rules and line breaks; and its marks: bold, italic, underline, code and links. Unknown nodes keep
 * their text.
 */
final class NoteMarkdown {

  private NoteMarkdown() {}

  static String of(String title, List<String> tags, Integer level, JsonNode doc) {
    StringBuilder out = new StringBuilder("# ").append(title.strip()).append("\n\n");
    if (level != null || !tags.isEmpty()) {
      if (level != null) {
        out.append("Level ").append(level);
      }
      if (!tags.isEmpty()) {
        out.append(level != null ? " · " : "").append("Tags: ").append(String.join(", ", tags));
      }
      out.append("\n\n");
    }
    blocks(out, doc.path("content"), "");
    return out.toString().strip() + "\n";
  }

  private static void blocks(StringBuilder out, JsonNode nodes, String indent) {
    for (JsonNode node : nodes) {
      block(out, node, indent);
    }
  }

  private static void block(StringBuilder out, JsonNode node, String indent) {
    switch (node.path("type").asString("")) {
      case "heading" -> {
        int level = Math.max(1, Math.min(6, node.path("attrs").path("level").asInt(2)));
        out.append(indent).append("#".repeat(level)).append(' ');
        out.append(inline(node.path("content"))).append("\n\n");
      }
      case "bulletList", "orderedList" -> {
        boolean numbered = node.path("type").asString("").equals("orderedList");
        int number = node.path("attrs").path("start").asInt(1);
        for (JsonNode item : node.path("content")) {
          String marker = numbered ? (number++) + ". " : "- ";
          listItem(out, item, indent, marker);
        }
        if (indent.isEmpty()) {
          out.append('\n');
        }
      }
      case "codeBlock" -> {
        String language = node.path("attrs").path("language").asString("");
        out.append(indent).append("```").append(language == null ? "" : language).append('\n');
        for (String line : plain(node.path("content")).split("\n", -1)) {
          out.append(indent).append(line).append('\n');
        }
        out.append(indent).append("```\n\n");
      }
      case "blockquote" -> {
        StringBuilder inner = new StringBuilder();
        blocks(inner, node.path("content"), "");
        for (String line : inner.toString().strip().split("\n", -1)) {
          out.append(indent).append(line.isEmpty() ? ">" : "> " + line).append('\n');
        }
        out.append('\n');
      }
      case "horizontalRule" -> out.append(indent).append("---\n\n");
      default -> {
        String text = inline(node.path("content"));
        if (!text.isBlank()) {
          out.append(indent).append(text).append("\n\n");
        }
      }
    }
  }

  private static void listItem(StringBuilder out, JsonNode item, String indent, String marker) {
    String inner = indent + " ".repeat(marker.length());
    boolean first = true;
    for (JsonNode child : item.path("content")) {
      String type = child.path("type").asString("");
      if (type.equals("bulletList") || type.equals("orderedList")) {
        block(out, child, inner);
      } else if (first) {
        out.append(indent).append(marker).append(inline(child.path("content"))).append('\n');
        first = false;
      } else {
        out.append(inner).append(inline(child.path("content"))).append('\n');
      }
    }
    if (first) {
      out.append(indent).append(marker.strip()).append('\n');
    }
  }

  private static String plain(JsonNode nodes) {
    StringBuilder text = new StringBuilder();
    for (JsonNode node : nodes) {
      text.append(node.path("type").asString("").equals("hardBreak") ? "\n" : node.path("text").asString(""));
    }
    return text.toString();
  }

  private static String inline(JsonNode nodes) {
    StringBuilder text = new StringBuilder();
    for (JsonNode node : nodes) {
      if (node.path("type").asString("").equals("hardBreak")) {
        text.append("  \n");
        continue;
      }
      String value = node.path("text").asString("");
      boolean code = false;
      String link = null;
      boolean bold = false;
      boolean italic = false;
      boolean underline = false;
      for (JsonNode mark : node.path("marks")) {
        switch (mark.path("type").asString("")) {
          case "bold" -> bold = true;
          case "italic" -> italic = true;
          case "underline" -> underline = true;
          case "code" -> code = true;
          case "link" -> link = mark.path("attrs").path("href").asString(null);
          default -> {}
        }
      }
      String piece = code ? "`" + value + "`" : escape(value);
      if (underline) piece = "<u>" + piece + "</u>";
      if (italic) piece = "*" + piece + "*";
      if (bold) piece = "**" + piece + "**";
      if (link != null) piece = "[" + piece + "](" + link + ")";
      text.append(piece);
    }
    return text.toString();
  }

  private static String escape(String text) {
    return text.replaceAll("([\\\\*_`\\[\\]<])", "\\\\$1");
  }
}

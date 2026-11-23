package com.algoquest.notes;

import com.algoquest.access.AuthenticatedUser;
import com.algoquest.notes.NoteService.NoteRequest;
import com.algoquest.notes.NoteService.NoteSummary;
import com.algoquest.notes.NoteService.NoteView;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Personal notes (D-074). Each account reads and writes only its own notes. */
@RestController
@RequestMapping("/api/v1/notes")
@PreAuthorize("hasPermission(null, 'notes.manage')")
public class NoteController {

  private final NoteService notes;

  public NoteController(NoteService notes) {
    this.notes = notes;
  }

  @GetMapping
  public List<NoteSummary> list(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String tag,
      @RequestParam(required = false) Integer level) {
    return notes.list(user.id(), q, tag, level);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public NoteView create(
      @AuthenticationPrincipal AuthenticatedUser user, @RequestBody NoteRequest request) {
    return notes.create(user.id(), request);
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> export(@AuthenticationPrincipal AuthenticatedUser user) {
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("application/zip"))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            ContentDisposition.attachment().filename("algoquest-notes.zip").build().toString())
        .body(notes.export(user.id()));
  }

  @GetMapping("/{id}")
  public NoteView get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    return notes.get(user.id(), id);
  }

  @PutMapping("/{id}")
  public NoteView update(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable UUID id,
      @RequestBody NoteRequest request) {
    return notes.update(user.id(), id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
    notes.delete(user.id(), id);
  }
}

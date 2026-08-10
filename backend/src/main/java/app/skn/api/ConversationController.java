package app.skn.api;

import app.skn.api.ApiModels.*;
import app.skn.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai/conversations")
public class ConversationController {
    private final ConversationService service;

    public ConversationController(ConversationService service) {
        this.service = service;
    }

    @GetMapping
    List<ConversationView> conversations() {
        return service.conversations();
    }

    @GetMapping("/{id}")
    ConversationView conversation(@PathVariable long id) {
        return service.conversation(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ConversationView create(@Valid @RequestBody CreateConversationRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/messages")
    ConversationView send(@PathVariable long id, @Valid @RequestBody SendMessageRequest request) {
        return service.send(id, request);
    }

    @PostMapping("/{id}/rescue/apply")
    ExperienceView applyRescue(@PathVariable long id, @Valid @RequestBody ApplyRescueRequest request) {
        return service.applyRescue(id, request);
    }
}

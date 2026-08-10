package app.skn.api;

import app.skn.api.ApiModels.*;
import app.skn.service.SkincareService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class ExperienceController {
    private final SkincareService service;

    public ExperienceController(SkincareService service) {
        this.service = service;
    }

    @GetMapping("/me/experiences/current")
    ResponseEntity<ExperienceView> current() {
        return service.home().currentExperience() == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(service.home().currentExperience());
    }

    @GetMapping("/me/experiences/{id}")
    ExperienceView experience(@PathVariable long id) {
        return service.experience(id);
    }

    @PostMapping("/me/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    ExperienceView start(@Valid @RequestBody StartExperienceRequest request) {
        return service.startExperience(request);
    }

    @PostMapping("/me/experiences/{id}/records")
    @ResponseStatus(HttpStatus.CREATED)
    SavedExperienceRecord record(@PathVariable long id, @Valid @RequestBody RecordExperienceRequest request) {
        return service.record(id, request);
    }

    @PostMapping("/me/experiences/{id}/complete")
    ApiMessage complete(@PathVariable long id) {
        return service.completeExperience(id);
    }

    @GetMapping("/me/experience-records")
    List<ExperienceRecordView> records() {
        return service.records();
    }

    @GetMapping("/me/patterns")
    List<PatternView> patterns() {
        return service.patterns();
    }

    @GetMapping("/me/patterns/{id}")
    PatternView pattern(@PathVariable long id) {
        return service.pattern(id);
    }
}

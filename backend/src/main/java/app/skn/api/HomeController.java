package app.skn.api;

import app.skn.api.ApiModels.HomeView;
import app.skn.service.SkincareService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HomeController {
    private final SkincareService service;

    public HomeController(SkincareService service) {
        this.service = service;
    }

    @GetMapping("/home")
    HomeView home() {
        return service.home();
    }
}

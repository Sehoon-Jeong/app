package app.skn.api;

import app.skn.api.ApiModels.ApiMessage;
import app.skn.service.DemoService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/demo")
public class DemoController {
    private final DemoService service;

    public DemoController(DemoService service) {
        this.service = service;
    }

    @PostMapping("/reset")
    ApiMessage reset(@RequestParam(defaultValue = "default") String scenario) {
        service.reset(scenario);
        return new ApiMessage("데모 데이터를 초기화했어요.");
    }
}

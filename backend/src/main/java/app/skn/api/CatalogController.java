package app.skn.api;

import app.skn.api.ApiModels.*;
import app.skn.service.SkincareService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CatalogController {
    private final SkincareService service;

    public CatalogController(SkincareService service) {
        this.service = service;
    }

    @GetMapping("/products")
    ProductPageView products(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "24") int limit
    ) {
        return service.productPage(query, cursor, limit);
    }

    @GetMapping("/products/{id}")
    ProductView product(@PathVariable long id) {
        return service.product(id);
    }

    @GetMapping("/me/products")
    List<UserProductView> userProducts() {
        return service.userProducts();
    }

    @GetMapping("/me/products/{id}")
    UserProductView userProduct(@PathVariable long id) {
        return service.userProduct(id);
    }

    @PostMapping("/me/products")
    @ResponseStatus(HttpStatus.CREATED)
    UserProductView addUserProduct(@Valid @RequestBody AddUserProductRequest request) {
        return service.addUserProduct(request);
    }
}

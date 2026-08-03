package com.infosys.auth.service;

import com.infosys.auth.model.Product;
import com.infosys.auth.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts(String query, String category) {
        if ((query != null && !query.trim().isEmpty()) || (category != null && !category.trim().isEmpty())) {
            String q = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
            String cat = (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) ? category.trim() : null;
            return productRepository.searchProducts(q, cat);
        }
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public List<Product> getProductsByVendor(Long vendorId) {
        return productRepository.findByVendorId(vendorId);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product details) {
        Product product = getProductById(id);
        if (details.getName() != null) product.setName(details.getName());
        if (details.getDescription() != null) product.setDescription(details.getDescription());
        if (details.getPrice() != null) product.setPrice(details.getPrice());
        if (details.getCategory() != null) product.setCategory(details.getCategory());
        if (details.getStockQuantity() != null) product.setStockQuantity(details.getStockQuantity());
        if (details.getImageUrl() != null) product.setImageUrl(details.getImageUrl());
        if (details.getSku() != null) product.setSku(details.getSku());
        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}

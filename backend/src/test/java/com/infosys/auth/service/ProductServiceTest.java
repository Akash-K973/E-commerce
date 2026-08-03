package com.infosys.auth.service;

import com.infosys.auth.model.Product;
import com.infosys.auth.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAllProducts_withQueryAndCategory_callsSearchProducts() {
        Product p = new Product();
        p.setName("Laptop");

        when(productRepository.searchProducts("laptop", "Electronics")).thenReturn(List.of(p));

        List<Product> result = productService.getAllProducts("laptop", "Electronics");

        assertEquals(1, result.size());
        assertEquals("Laptop", result.get(0).getName());
        verify(productRepository).searchProducts("laptop", "Electronics");
    }

    @Test
    void getAllProducts_withNullCategoryAndALLCategory_normalizesNulls() {
        Product p = new Product();
        when(productRepository.searchProducts("laptop", null)).thenReturn(List.of(p));

        List<Product> result = productService.getAllProducts("laptop", "ALL");

        assertEquals(1, result.size());
        verify(productRepository).searchProducts("laptop", null);
    }

    @Test
    void getAllProducts_withoutFilters_callsFindAll() {
        Product p = new Product();
        when(productRepository.findAll()).thenReturn(List.of(p));

        List<Product> result = productService.getAllProducts(null, "");

        assertEquals(1, result.size());
        verify(productRepository).findAll();
        verify(productRepository, never()).searchProducts(any(), any());
    }
}

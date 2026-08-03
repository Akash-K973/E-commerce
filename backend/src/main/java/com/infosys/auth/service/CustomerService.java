package com.infosys.auth.service;

import com.infosys.auth.model.CartItem;
import com.infosys.auth.model.Order;
import com.infosys.auth.model.OrderItem;
import com.infosys.auth.model.Product;
import com.infosys.auth.repository.CartItemRepository;
import com.infosys.auth.repository.OrderRepository;
import com.infosys.auth.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public CustomerService(CartItemRepository cartItemRepository,
                           OrderRepository orderRepository,
                           ProductRepository productRepository) {
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    public List<CartItem> getCart(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public CartItem addToCart(Long userId, Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Optional<CartItem> existing = cartItemRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + (quantity != null ? quantity : 1));
            return cartItemRepository.save(item);
        } else {
            CartItem newItem = new CartItem(userId, product, quantity != null ? quantity : 1);
            return cartItemRepository.save(newItem);
        }
    }

    public CartItem updateCartQuantity(Long cartItemId, Integer quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        if (quantity <= 0) {
            cartItemRepository.delete(item);
            return null;
        }
        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    public void removeFromCart(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    @Transactional
    public Order checkout(Long userId, String customerName, String shippingAddress) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cannot checkout: Cart is empty");
        }

        BigDecimal total = BigDecimal.ZERO;
        Order order = new Order(userId, customerName, BigDecimal.ZERO, shippingAddress);

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            total = total.add(itemTotal);

            OrderItem orderItem = new OrderItem(
                    product.getId(),
                    product.getName(),
                    product.getImageUrl(),
                    product.getPrice(),
                    cartItem.getQuantity(),
                    product.getVendorId()
            );
            order.getItems().add(orderItem);

            // Deduct stock quantity
            if (product.getStockQuantity() >= cartItem.getQuantity()) {
                product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
                productRepository.save(product);
            }
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Clear user cart
        cartItemRepository.deleteAll(cartItems);

        return savedOrder;
    }

    public List<Order> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}

package com.infosys.auth.dto;

public class RazorpayOrderRequest {
    private Long userId;
    private String customerName;
    private String shippingAddress;

    public RazorpayOrderRequest() {}

    public RazorpayOrderRequest(Long userId, String customerName, String shippingAddress) {
        this.userId = userId;
        this.customerName = customerName;
        this.shippingAddress = shippingAddress;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
}

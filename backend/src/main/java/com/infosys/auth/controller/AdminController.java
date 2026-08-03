package com.infosys.auth.controller;

import com.infosys.auth.model.User;
import com.infosys.auth.model.VendorProfile;
import com.infosys.auth.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<User> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> payload) {
        String role = payload.get("role");
        return ResponseEntity.ok(adminService.updateUserRole(userId, role));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<VendorProfile>> getAllVendors() {
        return ResponseEntity.ok(adminService.getAllVendors());
    }

    @PutMapping("/vendors/{vendorId}/status")
    public ResponseEntity<VendorProfile> updateVendorStatus(
            @PathVariable Long vendorId,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(adminService.updateVendorStatus(vendorId, status));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}

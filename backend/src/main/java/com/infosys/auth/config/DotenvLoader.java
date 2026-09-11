package com.infosys.auth.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Lightweight, zero-dependency .env file loader for Spring Boot.
 * Reads KEY=VALUE pairs from .env and populates System.getProperties(),
 * making them immediately available to application.properties and @Value annotations.
 */
public class DotenvLoader {

    public static void load() {
        List<String> candidatePaths = Arrays.asList(
            ".env",
            "backend/.env",
            "../.env",
            "../backend/.env"
        );

        for (String path : candidatePaths) {
            File file = new File(path);
            if (file.exists() && file.isFile()) {
                System.out.println("[DotenvLoader] Loading environment variables from: " + file.getAbsolutePath());
                loadFromFile(file);
                return;
            }
        }

        System.out.println("[DotenvLoader] No .env file found in standard locations. Using system environment / default properties.");
    }

    private static void loadFromFile(File file) {
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Ignore empty lines and comments
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int sep = line.indexOf('=');
                if (sep > 0) {
                    String key = line.substring(0, sep).trim();
                    String val = line.substring(sep + 1).trim();

                    // Strip surrounding quotes if present
                    if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                        if (val.length() >= 2) {
                            val = val.substring(1, val.length() - 1);
                        }
                    }

                    // Only set if not already set in System properties or OS environment
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, val);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("[DotenvLoader] Error reading .env file: " + e.getMessage());
        }
    }
}

package com.example.voice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.voice.dto.AuthResponse;
import com.example.voice.security.JwtUtil;
import com.example.voice.service.AuthService;
import com.example.voice.service.VoiceAuthService;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private VoiceAuthService voiceAuthService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    // 🔐 Register
    @PostMapping("/register")
    public String register(@RequestParam String username,
            @RequestParam String password) {
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Invalid username");
        }
        return authService.register(username, password);
    }

    // 🔐 Login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestParam String username,
            @RequestParam String password) {
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Invalid username");
        }
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(new AuthResponse(token, "SUCCESS", "Login successful"));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "ERROR", "Invalid credentials"));
        }
    }

    // 🎯 Phrase API
    @GetMapping("/phrase")
    public Map<String, List<String>> getPhrase() {

        List<String> phrases = new ArrayList<>(List.of(
                "I confirm my identity for secure login",
                "Authorize access using my voice today",
                "This is my voice verification request",
                "I am verifying my identity right now",
                "Grant access to my account securely",
                "This session is verified by my voice",
                "I confirm access using voice authentication",
                "My voice is being used for secure login",
                "This login attempt is verified by me",
                "I authorize this secure voice login"));

        Collections.shuffle(phrases);

        // Return 3 random phrases
        return Map.of("phrases", phrases.subList(0, 3));
    }

    // 🎙️ Voice Authentication
    @PostMapping("/process")
    public ResponseEntity<?> processVoice(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("username") String username,
            @RequestParam("mode") String mode,
            @RequestParam(value = "phrase", required = false) String phrase,
            Principal principal) {
        if (username == null || username.isBlank()) {
            throw new RuntimeException("Invalid username");
        }

        if (principal == null || !principal.getName().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", "ERROR", "message", "Username does not match authenticated user"));
        }

        System.out.println("USERNAME: " + username);
        System.out.println("MODE: " + mode);
        System.out.println("PHRASE: " + phrase);

        return ResponseEntity.ok(
                voiceAuthService.processVoice(audio, username, mode, phrase));
    }
}
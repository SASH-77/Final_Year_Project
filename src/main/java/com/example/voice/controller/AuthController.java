package com.example.voice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.voice.service.AuthService;
import com.example.voice.service.VoiceAuthService;

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

    // 🔐 Register
    @PostMapping("/register")
    public String register(@RequestParam String username,
            @RequestParam String password) {
        return authService.register(username, password);
    }

    // 🔐 Login
    @PostMapping("/login")
    public String login(@RequestParam String username,
            @RequestParam String password) {

        boolean valid = authService.login(username, password);

        return valid ? "Login successful" : "Invalid credentials";
    }

    // 🎯 Phrase API
    @GetMapping("/phrase")
    public Map<String, Object> getPhrase() {

        return Map.of(
                "phrases", List.of(
                        "My voice is my password",
                        "My voice is my password",
                        "My voice is my password"));
    }

    // 🎙️ Voice Authentication
    @PostMapping("/process")
    public Map<String, Object> processAudio(
            @RequestParam("audio") MultipartFile file,
            @RequestParam("phrase") String phrase) throws java.io.IOException {

        return voiceAuthService.processVoice(file, phrase);
    }
}
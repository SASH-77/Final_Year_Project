package com.example.voice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.voice.service.AuthService;

@RestController
@RequestMapping("/auth")
@CrossOrigin("*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public String register(@RequestParam String username,
            @RequestParam String password) {
        return authService.register(username, password);
    }

    @PostMapping("/login")
    public String login(@RequestParam String username,
            @RequestParam String password) {

        boolean valid = authService.login(username, password);

        if (valid)
            return "Login successful";
        else
            return "Invalid credentials";
    }
}
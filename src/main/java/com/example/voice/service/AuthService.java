package com.example.voice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.voice.model.User;
import com.example.voice.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String register(String username, String password) {

        if (userRepository.findByUsername(username) != null) {
            return "User already exists";
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(encoder.encode(password));

        userRepository.save(user);

        return "User registered successfully";
    }

    public boolean login(String username, String password) {

        User user = userRepository.findByUsername(username);

        if (user == null)
            return false;

        return encoder.matches(password, user.getPassword());
    }
}
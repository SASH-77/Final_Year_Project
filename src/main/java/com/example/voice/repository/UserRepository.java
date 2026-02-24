package com.example.voice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.voice.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
package com.example.voice.service;

import com.example.voice.dto.CommandResult;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class CommandParserService {

    private static final Set<String> VALID_BASE_COMMANDS =
            Set.of("OPEN", "CLOSE");

    private static final Set<String> VALID_TARGETS =
            Set.of("CALCULATOR", "NOTEPAD", "BROWSER", "CAMERA");

    public CommandResult validate(String text) {

        if (text == null || text.isBlank()) {
            return new CommandResult(false, "Empty command");
        }

        String cleaned = text
                .toUpperCase()
                .replaceAll("[^A-Z ]", "")
                .trim();

        String[] parts = cleaned.split("\\s+");

        if (parts.length < 2) {
            return new CommandResult(false, "Invalid format");
        }

        String baseCommand = parts[0];

        if (!VALID_BASE_COMMANDS.contains(baseCommand)) {
            return new CommandResult(false, "Invalid base command");
        }

        String target = parts[1];

        if (!VALID_TARGETS.contains(target)) {
            return new CommandResult(false, "Invalid target");
        }

        return new CommandResult(
                true,
                "Command accepted: " + baseCommand + " " + target
        );
    }
}


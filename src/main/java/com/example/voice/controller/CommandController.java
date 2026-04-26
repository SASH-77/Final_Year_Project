package com.example.voice.controller;

import com.example.voice.dto.CommandResult;
import com.example.voice.service.CommandParserService;
import com.example.voice.service.CommandExecutionService;
import com.example.voice.service.LoggingService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/command")
@CrossOrigin
public class CommandController {

    private final CommandParserService parserService;
    private final CommandExecutionService executionService;
    private final LoggingService loggingService;
    private final com.example.voice.service.VoiceAuthService voiceAuthService;

    public CommandController(
            CommandParserService parserService,
            CommandExecutionService executionService,
            LoggingService loggingService,
            com.example.voice.service.VoiceAuthService voiceAuthService) {
        this.parserService = parserService;
        this.executionService = executionService;
        this.loggingService = loggingService;
        this.voiceAuthService = voiceAuthService;
    }

    // modified to consume multipart so we can receive raw audio
    @PostMapping(value = "/parse", consumes = { "multipart/form-data" })
    public CommandResult process(
            @RequestParam String speechText,
            @RequestParam String username,
            @RequestPart("audio") org.springframework.web.multipart.MultipartFile audio,
            Principal principal) {

        if (principal == null || !principal.getName().equals(username)) {
            return new CommandResult(false, "USER_MISMATCH");
        }

        // first validate the command text
        CommandResult result = parserService.validate(speechText);

        loggingService.log(
                "COMMAND_VALIDATION",
                speechText,
                result.isAuthorized());

        if (!result.isAuthorized()) {
            return result; // invalid command, don't check voice
        }

        // then run voice authentication
        boolean voiceOk = voiceAuthService.authenticate(audio, username);
        loggingService.log("VOICE_AUTH", speechText, voiceOk);

        if (!voiceOk) {
            return new CommandResult(false, "VOICE_NOT_AUTHORIZED");
        }

        try {
            executionService.execute(result.getMessage());

            loggingService.log(
                    "COMMAND_EXECUTION",
                    result.getMessage(),
                    true);

            return new CommandResult(true, "Executed successfully");

        } catch (Exception e) {

            loggingService.log(
                    "COMMAND_EXECUTION",
                    result.getMessage(),
                    false);

            return new CommandResult(false, "Execution failed");
        }
    }

    @GetMapping("/logs")
    public String getLogs() {
        try {
            java.nio.file.Path path = java.nio.file.Paths.get("logs/system.log");

            if (!java.nio.file.Files.exists(path)) {
                return "No logs available yet.";
            }

            return java.nio.file.Files.readString(path);

        } catch (Exception e) {
            return "Error reading logs.";
        }
    }
}
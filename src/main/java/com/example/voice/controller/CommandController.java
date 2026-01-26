package com.example.voice.controller;

import com.example.voice.dto.CommandResult;
import com.example.voice.dto.SpeechRequest;
import com.example.voice.service.CommandParserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/command")
@CrossOrigin
public class CommandController {

    private final CommandParserService service;

    public CommandController(CommandParserService service) {
        this.service = service;
    }

    @PostMapping("/parse")
    public CommandResult process(@RequestBody SpeechRequest request) {
        return service.validate(request.getSpeechText());
    }
}

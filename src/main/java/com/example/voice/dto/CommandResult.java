package com.example.voice.dto;

public class CommandResult {

    private boolean authorized;
    private String message;

    public CommandResult(boolean authorized, String message) {
        this.authorized = authorized;
        this.message = message;
    }

    public boolean isAuthorized() {
        return authorized;
    }

    public String getMessage() {
        return message;
    }
}

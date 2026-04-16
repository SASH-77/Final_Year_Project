package com.example.voice.service;

import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class CommandExecutionService {

    public void execute(String command) throws IOException {

        switch (command) {

            case "OPEN CALCULATOR":
                Runtime.getRuntime().exec("calc");
                break;

            case "OPEN NOTEPAD":
                Runtime.getRuntime().exec("notepad");
                break;

            case "OPEN BROWSER":
                Runtime.getRuntime().exec(
                        new String[]{"cmd", "/c", "start chrome"}
                );
                break;

            case "OPEN CAMERA":
                Runtime.getRuntime().exec(
                        new String[]{"cmd", "/c", "start microsoft.windows.camera:"}
                );
                break;

            default:
                throw new IllegalArgumentException("Unsupported command");
        }
    }
}
                    
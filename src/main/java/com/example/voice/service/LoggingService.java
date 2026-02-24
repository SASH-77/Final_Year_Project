package com.example.voice.service;

import org.springframework.stereotype.Service;

import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class LoggingService {

    private static final String LOG_FILE = "logs/system.log";

    public void log(String eventType, String command, boolean success) {

        try {
            java.io.File dir = new java.io.File("logs");
            if (!dir.exists()) {
                dir.mkdirs();
            }

            FileWriter writer = new FileWriter(LOG_FILE, true);

            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

            String status = success ? "SUCCESS" : "FAILED";

            writer.write("[" + timestamp + "] | "
                    + eventType + ": " + status
                    + " | COMMAND: " + command + "\n");

            writer.close();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
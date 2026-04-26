package com.example.voice.service;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;

@Service
public class VoiceAuthService {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> processVoice(
            MultipartFile audio,
            String username,
            String mode,
            String phrase
    ) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        
            if (audio != null && !audio.isEmpty()) {
                File tempFile = File.createTempFile("voice", ".webm");
                audio.transferTo(tempFile);

                body.add("file", new org.springframework.core.io.FileSystemResource(tempFile));
            }

            
            body.add("username", username);
            body.add("mode", mode);
            body.add("phrase", phrase);

            HttpEntity<MultiValueMap<String, Object>> request =
                    new HttpEntity<>(body, headers);

            String url = "http://localhost:6000/extract";

            ResponseEntity<Map<String, Object>> response =
                    restTemplate.exchange(
                            url,
                            HttpMethod.POST,
                            request,
                            new ParameterizedTypeReference<>() {}
                    );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            return Map.of("status", "ERROR", "message", "Invalid backend response");

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("status", "ERROR", "message", e.getMessage());
        }
    }

    
    public Map<String, Object> processVoice(MultipartFile audio, String username) {
        return processVoice(audio, username, "verify", "");
    }

    
    public boolean authenticate(MultipartFile audio, String username) {
        Object status = processVoice(audio, username).get("status");
        return "GRANTED".equals(status);
    }
}
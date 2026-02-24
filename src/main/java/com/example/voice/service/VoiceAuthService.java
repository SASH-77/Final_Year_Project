package com.example.voice.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;

@Service
public class VoiceAuthService {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends the audio file to the Python micro‑service and returns whether the
     * speaker was recognized as authorized.
     */
    public boolean authenticate(MultipartFile audio) {
        try {
            // build multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // RestTemplate does not support MultipartFile directly, so we convert
            // to a temporary file first.
            File tmp = File.createTempFile("voice", ".wav");
            try (FileOutputStream fos = new FileOutputStream(tmp)) {
                fos.write(audio.getBytes());
            }
            body.add("file", new org.springframework.core.io.FileSystemResource(tmp));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // assume python service is running on localhost:5000
            String url = "http://localhost:5000/auth";

            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

            // response body should be JSON like {"status":"ACCESS GRANTED",...}
            if (response.getStatusCode().is2xxSuccessful()) {
                String resp = response.getBody();
                return resp != null && resp.contains("ACCESS GRANTED");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }
}

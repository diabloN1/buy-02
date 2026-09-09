package com.buy01.media.controller;

import java.io.IOException;
import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.buy01.media.entity.Media;
import com.buy01.media.service.MediaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/media/images")
@RequiredArgsConstructor
public class MediaController {

        private final MediaService mediaService;

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @PreAuthorize("isAuthenticated() and (#productId == null or hasAnyRole('SELLER'))")
        public ResponseEntity<Media> upload(
                        @RequestPart("image") MultipartFile image,
                        @RequestParam(required = false) String productId) throws IOException {

                Media media = mediaService.upload(image, productId);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(media);
        }

        @GetMapping("/{id}")
        public ResponseEntity<Resource> get(@PathVariable String id) {
                Media media = mediaService.get(id);
                Resource resource = mediaService.download(id);

                return ResponseEntity.ok()
                                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)))
                                .contentType(MediaType.parseMediaType(media.getContentType()))
                                .body(resource);
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("isAuthenticated()")
        public ResponseEntity<Void> delete(@PathVariable String id,
                        @RequestParam(required = false) boolean fromService) {
                mediaService.delete(id, fromService);
                return ResponseEntity.noContent().build();
        }

        @GetMapping("/user/{userId}")
        @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
        public ResponseEntity<Page<Media>> getMediaByUser(@PathVariable String userId, Pageable pageable) {
                return ResponseEntity.ok(mediaService.getMediaByUserId(userId, pageable));
        }

        @GetMapping("/count")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Long> countMedia() {
                return ResponseEntity.ok(mediaService.countMedia());
        }
}
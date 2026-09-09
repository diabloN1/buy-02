package com.__buy.user_service.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.__buy.user_service.aop.Auditable;
import com.__buy.user_service.dto.CreateUserRequest;
import com.__buy.user_service.dto.UpdateUserRequest;
import com.__buy.user_service.dto.UserResponse;
import com.__buy.user_service.entity.Role;
import com.__buy.user_service.entity.User;
import com.__buy.user_service.event.AuditAction;
import com.__buy.user_service.exception.EmailAlreadyExistsException;
import com.__buy.user_service.exception.UserNotFoundException;
import com.__buy.user_service.mapper.UserMapper;
import com.__buy.user_service.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserAvatarService avatarService;
    private final UserMapper userMapper;

    @Override
    public UserResponse getUserById(String id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return mapToResponse(user);
    }

    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepo.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public UserResponse getCurrentUser(String userId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        return mapToResponse(user);
    }

    @Override
    @Auditable(action = AuditAction.CREATED, entityId = "#result.id")
    public UserResponse createUser(CreateUserRequest userReq) {
        log.info("Attempting to create user with email: {}", userReq.getEmail());
        if (userRepo.existsByEmail(userReq.getEmail())) {
            throw new EmailAlreadyExistsException(userReq.getEmail());
        }

        User user = User.builder()
                .name(userReq.getName())
                .email(userReq.getEmail())
                .password(passwordEncoder.encode(userReq.getPassword()))
                .role(Role.USER)
                .build();

        userRepo.save(user);
        log.info("Successfully created user ID: {}", user.getId());

        return mapToResponse(user);
    }

    @Override
    @Auditable(action = AuditAction.MODIFIED, entityId = "#id")
    public UserResponse updateUser(String id, UpdateUserRequest updateReq) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));



        if (userRepo.findByEmail(updateReq.getEmail()).isPresent())  {
            throw new EmailAlreadyExistsException(updateReq.getEmail());
        }

        user.setName(updateReq.getName());
        user.setEmail(updateReq.getEmail());

        userRepo.save(user);

        return mapToResponse(user);
    }

    @Override
    @Auditable(action = AuditAction.DELETED, entityId = "#id")
    public void deleteUser(String id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        avatarService.deleteAvatar(user.getAvatarId());
        userRepo.delete(user);
        log.info("Deleted user ID: {}", id);
    }

    private UserResponse mapToResponse(User user) {
        return userMapper.toResponse(user);
    }

    @Override
    public long countUsers() {
        return userRepo.count();
    }

    @Override
    public UserResponse uploadAvatar(String userId, MultipartFile avatar) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        String oldAvatarId = user.getAvatarId();

        String avatarId = avatarService.uploadAvatar(avatar);
        user.setAvatarId(avatarId);
        userRepo.save(user);

        if (oldAvatarId != null) {
            avatarService.deleteAvatar(oldAvatarId);
        }

        return mapToResponse(user);
    }

    @Override
    public void deleteAvatar(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        user.setAvatarId(null);
        userRepo.save(user);

        log.info("Deleted avatar for user: {}", user.getName());
    }
}
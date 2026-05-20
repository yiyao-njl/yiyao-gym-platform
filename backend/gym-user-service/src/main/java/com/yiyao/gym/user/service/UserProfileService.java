package com.yiyao.gym.user.service;

import com.yiyao.gym.common.data.CommercialDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserProfileService {
    private final CommercialDataRepository repository;

    public UserProfileService(CommercialDataRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> me() {
        return repository.userById("app-user-001");
    }

    public List<Map<String, Object>> points() {
        return repository.points("app-user-001");
    }
}

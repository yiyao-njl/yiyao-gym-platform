package com.yiyao.gym.member.controller;

import com.yiyao.gym.common.api.ApiResponse;
import com.yiyao.gym.common.api.ErrorCode;
import com.yiyao.gym.common.api.PageResponse;
import com.yiyao.gym.common.data.CommercialDataRepository;
import com.yiyao.gym.common.exception.BizException;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
public class MemberController {
    private static final Set<String> LEVEL_CODES = Set.of("LV1", "LV2", "LV3");

    private final CommercialDataRepository repository;

    public MemberController(CommercialDataRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/app/members/benefits")
    public ApiResponse<List<Map<String, Object>>> benefits() {
        return ApiResponse.ok(repository.members());
    }

    @PostMapping("/api/app/members/orders")
    public ApiResponse<Map<String, Object>> createMemberOrder() {
        return ApiResponse.ok(Map.of("orderNo", "YYMEM202605170001", "orderType", "MEMBER", "payAmountCent", 19900));
    }

    @GetMapping("/api/admin/members")
    public ApiResponse<List<Map<String, Object>>> adminMembers() {
        return ApiResponse.ok(repository.members());
    }

    @PutMapping("/api/admin/members")
    public ApiResponse<List<Map<String, Object>>> updateMembers(@RequestBody List<Map<String, Object>> levels) {
        return ApiResponse.ok(repository.updateMemberLevels(validateMemberLevels(levels)));
    }

    @GetMapping("/api/admin/users")
    public ApiResponse<PageResponse<Map<String, Object>>> adminUsers() {
        return ApiResponse.ok(PageResponse.of(1, 20, repository.users().size(), repository.users()));
    }

    @GetMapping("/api/admin/users/summary")
    public ApiResponse<Map<String, Object>> adminUserSummary() {
        return ApiResponse.ok(repository.userSummary());
    }

    private List<Map<String, Object>> validateMemberLevels(List<Map<String, Object>> levels) {
        if (levels == null || levels.size() != 3) {
            throw new BizException(ErrorCode.PARAM_INVALID, "会员等级必须且只能配置 3 条");
        }

        List<Map<String, Object>> normalized = levels.stream().map(this::normalizeMemberLevel).toList();
        Set<String> submittedCodes = normalized.stream()
                .map(level -> String.valueOf(level.get("levelCode")))
                .collect(java.util.stream.Collectors.toSet());
        if (!submittedCodes.equals(LEVEL_CODES)) {
            throw new BizException(ErrorCode.PARAM_INVALID, "会员等级编码必须为 LV1、LV2、LV3");
        }

        List<Map<String, Object>> sorted = normalized.stream()
                .sorted(Comparator.comparingInt(level -> levelOrder(String.valueOf(level.get("levelCode")))))
                .toList();
        if ((Integer) sorted.get(0).get("minPoints") != 0) {
            throw new BizException(ErrorCode.PARAM_INVALID, "LV1 成长值下限必须为 0");
        }
        for (int i = 1; i < sorted.size(); i += 1) {
            int previous = (Integer) sorted.get(i - 1).get("minPoints");
            int current = (Integer) sorted.get(i).get("minPoints");
            if (current <= previous) {
                throw new BizException(ErrorCode.PARAM_INVALID, "会员等级成长值下限必须递增");
            }
        }
        return sorted;
    }

    private int levelOrder(String levelCode) {
        return switch (levelCode) {
            case "LV1" -> 1;
            case "LV2" -> 2;
            case "LV3" -> 3;
            default -> 99;
        };
    }

    private Map<String, Object> normalizeMemberLevel(Map<String, Object> raw) {
        if (raw == null) {
            throw new BizException(ErrorCode.PARAM_INVALID, "会员等级配置不能为空");
        }
        String levelCode = string(raw.get("levelCode"));
        String name = string(raw.get("name"));
        String benefits = string(raw.get("benefits"));
        int minPoints = number(raw.get("minPoints"), -1);
        int discountRate = number(raw.get("discountRate"), -1);
        if (!LEVEL_CODES.contains(levelCode)) {
            throw new BizException(ErrorCode.PARAM_INVALID, "会员等级编码必须为 LV1、LV2、LV3");
        }
        if (name.isBlank() || benefits.isBlank()) {
            throw new BizException(ErrorCode.PARAM_INVALID, "会员等级名称和权益说明不能为空");
        }
        if (minPoints < 0) {
            throw new BizException(ErrorCode.PARAM_INVALID, "成长值下限不能小于 0");
        }
        if (discountRate < 1 || discountRate > 100) {
            throw new BizException(ErrorCode.PARAM_INVALID, "折扣比例必须在 1 到 100 之间");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("levelCode", levelCode);
        result.put("name", name);
        result.put("discountRate", discountRate);
        result.put("benefits", benefits);
        result.put("minPoints", minPoints);
        return result;
    }

    private String string(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private int number(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ex) {
            return fallback;
        }
    }
}

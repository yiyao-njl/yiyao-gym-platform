package com.yiyao.gym.common.venue;

import com.yiyao.gym.common.enums.VenueOccupyStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class VenueScheduleMemory {
    private static final Map<String, List<Occupancy>> OCCUPANCIES = new ConcurrentHashMap<>();
    private static final Path STORE_PATH = Path.of(System.getProperty("java.io.tmpdir"), "yiyao-gym-venue-occupancies.tsv");

    private VenueScheduleMemory() {
    }

    public static synchronized void occupy(
            String orderId,
            String venueId,
            LocalDate bizDate,
            LocalTime startTime,
            LocalTime endTime,
            VenueOccupyStatus status
    ) {
        loadFromDisk();
        if (!isAvailable(venueId, bizDate, startTime, endTime)) {
            throw new IllegalStateException("场地时段已被占用");
        }
        OCCUPANCIES.computeIfAbsent(venueId, key -> new ArrayList<>())
                .add(new Occupancy(orderId, venueId, bizDate, startTime, endTime, status));
        persistToDisk();
    }

    public static synchronized boolean isAvailable(String venueId, LocalDate bizDate, LocalTime startTime, LocalTime endTime) {
        loadFromDisk();
        if (venueId == null || bizDate == null || startTime == null || endTime == null || !endTime.isAfter(startTime)) {
            return false;
        }
        return OCCUPANCIES.getOrDefault(venueId, List.of()).stream()
                .filter(item -> item.bizDate().equals(bizDate))
                .noneMatch(item -> overlaps(startTime, endTime, item.startTime(), item.endTime()));
    }

    public static List<Map<String, Object>> slots(String venueId) {
        loadFromDisk();
        return OCCUPANCIES.getOrDefault(venueId, List.of()).stream()
                .sorted(Comparator.comparing(Occupancy::bizDate).thenComparing(Occupancy::startTime))
                .map(item -> Map.<String, Object>of(
                        "venueId", item.venueId(),
                        "orderId", item.orderId(),
                        "bizDate", item.bizDate().toString(),
                        "startTime", item.startTime().toString(),
                        "endTime", item.endTime().toString(),
                        "status", effectiveStatus(item).name()
                ))
                .toList();
    }

    public static VenueOccupyStatus effectiveStatus(Occupancy item) {
        if (item.status() == VenueOccupyStatus.BOOKED
                && !LocalDateTime.of(item.bizDate(), item.startTime()).isAfter(LocalDateTime.now())) {
            return VenueOccupyStatus.USING;
        }
        return item.status();
    }

    public static String expiresAt(int minutes) {
        return OffsetDateTime.now(ZoneOffset.ofHours(8)).plusMinutes(minutes).toString();
    }

    private static boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
    }

    private static void loadFromDisk() {
        OCCUPANCIES.clear();
        if (!Files.exists(STORE_PATH)) return;
        try {
            for (String line : Files.readAllLines(STORE_PATH, StandardCharsets.UTF_8)) {
                String[] parts = line.split("\\t", -1);
                if (parts.length != 6) continue;
                Occupancy occupancy = new Occupancy(
                        parts[0],
                        parts[1],
                        LocalDate.parse(parts[2]),
                        LocalTime.parse(parts[3]),
                        LocalTime.parse(parts[4]),
                        VenueOccupyStatus.valueOf(parts[5])
                );
                OCCUPANCIES.computeIfAbsent(occupancy.venueId(), key -> new ArrayList<>()).add(occupancy);
            }
        } catch (Exception ignored) {
            OCCUPANCIES.clear();
        }
    }

    private static void persistToDisk() {
        List<String> lines = OCCUPANCIES.values().stream()
                .flatMap(List::stream)
                .map(item -> String.join("\t",
                        item.orderId(),
                        item.venueId(),
                        item.bizDate().toString(),
                        item.startTime().toString(),
                        item.endTime().toString(),
                        item.status().name()
                ))
                .toList();
        try {
            Files.write(STORE_PATH, lines, StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            // Demo fallback only; production must use Redis/MySQL and surface persistence errors.
        }
    }

    public record Occupancy(
            String orderId,
            String venueId,
            LocalDate bizDate,
            LocalTime startTime,
            LocalTime endTime,
            VenueOccupyStatus status
    ) {
    }
}

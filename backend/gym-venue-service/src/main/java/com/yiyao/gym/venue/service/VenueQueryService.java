package com.yiyao.gym.venue.service;

import com.yiyao.gym.common.data.CommercialDataRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class VenueQueryService {
    private final CommercialDataRepository repository;

    public VenueQueryService(CommercialDataRepository repository) {
        this.repository = repository;
    }

    public List<Map<String, Object>> cities() {
        return repository.cities();
    }

    public List<Map<String, Object>> stores() {
        return repository.stores();
    }

    public Map<String, Object> store(String storeId) {
        return repository.store(storeId);
    }

    public Map<String, Object> updateStore(String storeId, Map<String, Object> payload) {
        return repository.updateStore(storeId, payload);
    }

    public List<Map<String, Object>> venues() {
        return repository.venues();
    }

    public Map<String, Object> venue(String venueId) {
        return repository.venue(venueId);
    }

    public Map<String, Object> updateVenue(String venueId, Map<String, Object> payload) {
        return repository.updateVenue(venueId, payload);
    }

    public List<Map<String, Object>> venueTypes() {
        return repository.venueTypes();
    }

    public List<Map<String, Object>> packages() {
        return repository.packages();
    }

    public List<Map<String, Object>> slots(String venueId, LocalDate bizDate) {
        return repository.slots(venueId, bizDate);
    }

    public boolean isAvailable(String venueId, LocalDate bizDate, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        return repository.isVenueAvailable(venueId, bizDate, startTime, endTime);
    }
}

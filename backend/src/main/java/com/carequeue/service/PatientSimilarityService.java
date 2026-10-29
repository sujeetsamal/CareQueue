package com.carequeue.service;

import com.carequeue.dsa.StringUtil;
import com.carequeue.dto.SimilarPatientDto;
import com.carequeue.entity.PatientEntity;
import com.carequeue.entity.PatientStatus;
import com.carequeue.repository.PatientRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service providing existing-patient similarity matching during registration.
 *
 * Implements a multi-factor matching strategy:
 * 1. Normalized exact matching (whitespace-collapsed, case-insensitive).
 * 2. Case-insensitive substring matching.
 * 3. Dynamic Programming Levenshtein distance for fuzzy typo detection.
 * 4. Contextual bonus adjustments for department and age proximity.
 *
 * Results are bounded to the top 5 most relevant records.
 */
@Service
public class PatientSimilarityService {

    private static final Logger log = LoggerFactory.getLogger(PatientSimilarityService.class);
    private static final int MAX_RESULTS = 5;
    private static final double MIN_SIMILARITY_THRESHOLD = 0.65;

    private final PatientRepository patientRepository;

    public PatientSimilarityService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    /**
     * Finds existing patient records similar to the input criteria.
     * Returns empty list if query name has fewer than 2 characters.
     */
    @Transactional(readOnly = true)
    public List<SimilarPatientDto> findSimilarPatients(String nameQuery, String department, Integer age) {
        if (nameQuery == null) {
            return Collections.emptyList();
        }

        String normalizedQuery = normalizeForComparison(nameQuery);
        if (normalizedQuery.length() < 2) {
            return Collections.emptyList();
        }

        // Query historical database
        List<PatientEntity> allPatients = patientRepository.findAll();
        List<ScoredMatch> scoredMatches = new ArrayList<>();

        for (PatientEntity entity : allPatients) {
            String candidateName = entity.getName();
            if (candidateName == null) continue;

            String normalizedCandidate = normalizeForComparison(candidateName);
            if (normalizedCandidate.isEmpty()) continue;

            double baseScore = calculateNameSimilarity(normalizedQuery, normalizedCandidate);
            if (baseScore >= MIN_SIMILARITY_THRESHOLD) {
                double finalScore = adjustScoreWithContext(baseScore, department, age, entity);
                boolean isWaiting = entity.getStatus() == PatientStatus.WAITING;
                scoredMatches.add(new ScoredMatch(entity, finalScore, isWaiting));
            }
        }

        // Sort: highest similarity score first, then newest registration time
        scoredMatches.sort((a, b) -> {
            int scoreCmp = Double.compare(b.score, a.score);
            if (scoreCmp != 0) return scoreCmp;
            if (a.entity.getRegistrationTime() != null && b.entity.getRegistrationTime() != null) {
                return b.entity.getRegistrationTime().compareTo(a.entity.getRegistrationTime());
            }
            return 0;
        });

        List<SimilarPatientDto> results = new ArrayList<>();
        int count = Math.min(scoredMatches.size(), MAX_RESULTS);
        for (int i = 0; i < count; i++) {
            ScoredMatch match = scoredMatches.get(i);
            PatientEntity entity = match.entity;
            results.add(new SimilarPatientDto(
                    entity.getId(),
                    entity.getName(),
                    entity.getTokenNumber(),
                    entity.getDepartment(),
                    entity.getRegistrationTime(),
                    entity.getStatus(),
                    Math.round(match.score * 100.0) / 100.0,
                    match.isWaiting
            ));
        }

        log.debug("Similarity query '{}' returned {} matches", normalizedQuery, results.size());
        return results;
    }

    /**
     * Normalizes a string by trimming, lowercasing, and collapsing multiple internal whitespace characters.
     */
    public String normalizeForComparison(String raw) {
        if (raw == null) return "";
        return raw.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }

    /**
     * Computes similarity between two normalized strings:
     * - Exact match: 1.0
     * - Substring match: 0.85
     * - Levenshtein edit distance similarity: 1.0 - (editDistance / maxLen)
     */
    public double calculateNameSimilarity(String s1, String s2) {
        if (s1.equals(s2)) {
            return 1.0;
        }

        // Substring check
        if (s1.contains(s2) || s2.contains(s1)) {
            int minLen = Math.min(s1.length(), s2.length());
            int maxLen = Math.max(s1.length(), s2.length());
            return Math.max(0.80, (double) minLen / maxLen);
        }

        int distance = computeLevenshteinDistance(s1, s2);
        int maxLen = Math.max(s1.length(), s2.length());
        if (maxLen == 0) return 1.0;

        double distanceScore = 1.0 - ((double) distance / maxLen);

        // Allow up to 2 character typos even on medium-length names
        if (distance <= 2 && maxLen >= 4) {
            return Math.max(distanceScore, 0.75);
        }

        return Math.max(0.0, distanceScore);
    }

    /**
     * Classical Dynamic Programming Levenshtein Distance algorithm.
     * Computes minimum number of single-character edits (insertions, deletions, substitutions).
     * Time Complexity: O(m * n), Space Complexity: O(m * n).
     */
    public int computeLevenshteinDistance(String s1, String s2) {
        int m = s1.length();
        int n = s2.length();

        int[][] dp = new int[m + 1][n + 1];

        for (int i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= m; i++) {
            char c1 = s1.charAt(i - 1);
            for (int j = 1; j <= n; j++) {
                char c2 = s2.charAt(j - 1);
                int cost = (c1 == c2) ? 0 : 1;
                dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,       // deletion
                        Math.min(
                                dp[i][j - 1] + 1,   // insertion
                                dp[i - 1][j - 1] + cost // substitution
                        )
                );
            }
        }

        return dp[m][n];
    }

    /**
     * Adjusts base similarity score with supporting contextual signals (department match, age match).
     */
    private double adjustScoreWithContext(double baseScore, String dept, Integer age, PatientEntity entity) {
        double score = baseScore;

        if (dept != null && !dept.isBlank() && entity.getDepartment() != null) {
            if (dept.trim().equalsIgnoreCase(entity.getDepartment().trim())) {
                score += 0.05;
            }
        }

        if (age != null && entity.getAge() != null) {
            int ageDiff = Math.abs(age - entity.getAge());
            if (ageDiff == 0) {
                score += 0.05;
            } else if (ageDiff <= 3) {
                score += 0.02;
            }
        }

        return Math.min(1.0, score);
    }

    private record ScoredMatch(PatientEntity entity, double score, boolean isWaiting) {}
}

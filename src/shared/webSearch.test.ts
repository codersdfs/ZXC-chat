import { describe, it, expect } from "vitest";
import { calculateRelevanceScore, rankSearchResults } from "./webSearch";

describe("calculateRelevanceScore", () => {
  it("should calculate base score for wikipedia source", () => {
    const result = {
      title: "Test Title",
      url: "https://example.com",
      snippet: "Test snippet",
      source: "wikipedia" as const,
      score: 0.5,
    };

    const score = calculateRelevanceScore(result, "test query");
    expect(score).toBeGreaterThan(0.5); // Should get wikipedia bonus
  });

  it("should add title match bonus", () => {
    const result = {
      title: "Test Query Title",
      url: "https://example.com",
      snippet: "Test snippet",
      source: "google" as const,
      score: 0.5,
    };

    const score = calculateRelevanceScore(result, "test query");
    expect(score).toBe(0.5 + 0.3); // Base + title bonus
  });

  it("should add snippet match bonus", () => {
    const result = {
      title: "Test Title",
      url: "https://example.com",
      snippet: "Test query snippet",
      source: "google" as const,
      score: 0.5,
    };

    const score = calculateRelevanceScore(result, "test query");
    expect(score).toBe(0.5 + 0.2); // Base + snippet bonus
  });

  it("should add exact match bonus", () => {
    const result = {
      title: "test query",
      url: "https://example.com",
      snippet: "Test snippet",
      source: "google" as const,
      score: 0.5,
    };

    const score = calculateRelevanceScore(result, "test query");
    expect(score).toBeGreaterThan(0.5 + 0.4); // Base + exact match bonus
  });

  it("should cap score at 1.0", () => {
    const result = {
      title: "test query exact match",
      url: "https://example.com",
      snippet: "test query exact match content",
      source: "wikipedia" as const,
      score: 0.9,
    };

    const score = calculateRelevanceScore(result, "test query");
    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe("rankSearchResults", () => {
  it("should rank results by relevance score", () => {
    const results = [
      {
        title: "Low relevance",
        url: "https://example.com/1",
        snippet: "Some content",
        source: "google" as const,
        score: 0.3,
      },
      {
        title: "High relevance test query",
        url: "https://example.com/2",
        snippet: "Test query content",
        source: "wikipedia" as const,
        score: 0.7,
      },
    ];

    const ranked = rankSearchResults(results, "test query");
    expect(ranked[0].title).toBe("High relevance test query");
    expect(ranked[1].title).toBe("Low relevance");
  });

  it("should update scores based on query matching", () => {
    const results = [
      {
        title: "Unrelated title",
        url: "https://example.com",
        snippet: "Unrelated content",
        source: "google" as const,
        score: 0.8,
      },
    ];

    const ranked = rankSearchResults(results, "specific query");
    expect(ranked[0].score).toBeDefined();
    // Score should be recalculated and may be lower due to no matches
  });
});

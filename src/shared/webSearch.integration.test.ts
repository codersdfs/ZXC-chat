import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWebSearchWithRanking } from "./webSearch";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchWebSearchWithRanking", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should handle wikipedia search successfully", async () => {
    // Mock Wikipedia API response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("wikipedia.org/w/api.php")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              ["Test Query"], // titles
              ["Test description"], // descriptions
              ["https://en.wikipedia.org/wiki/Test"], // urls
            ]),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["wikipedia"],
      3,
      {},
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0].source).toBe("wikipedia");
    expect(result.results[0].title).toBe("Test Query");
    expect(result.citations).toHaveLength(1);
    expect(result.sources).toHaveLength(1);
  });

  it("should handle google search with API keys", async () => {
    // Mock Google Custom Search API response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("googleapis.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  title: "Google Result",
                  link: "https://example.com",
                  snippet: "Google search result snippet",
                },
              ],
            }),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["google"],
      3,
      {
        google: {
          apiKey: "test-key",
          cx: "test-cx",
        },
      },
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0].source).toBe("google");
    expect(result.results[0].title).toBe("Google Result");
  });

  it("should handle bing search with API keys", async () => {
    // Mock Bing Search API response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("api.bing.microsoft.com")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              webPages: {
                value: [
                  {
                    name: "Bing Result",
                    url: "https://example.com",
                    snippet: "Bing search result snippet",
                  },
                ],
              },
            }),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking("test query", ["bing"], 3, {
      bing: "test-api-key",
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].source).toBe("bing");
    expect(result.results[0].title).toBe("Bing Result");
  });

  it("should handle duckduckgo search", async () => {
    // Mock DuckDuckGo API response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("api.duckduckgo.com")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              AbstractText: "DuckDuckGo instant answer",
              Heading: "Test Query",
              AbstractURL: "https://example.com",
            }),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["duckduckgo"],
      3,
      {},
    );

    expect(result.results).toHaveLength(1);
    expect(result.results[0].source).toBe("duckduckgo");
    expect(result.results[0].snippet).toBe("DuckDuckGo instant answer");
  });

  it("should handle API failures gracefully", async () => {
    // Mock failed API response
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["wikipedia"],
      3,
      {},
    );

    expect(result.results).toHaveLength(0);
    expect(result.citations).toHaveLength(0);
    expect(result.sources).toHaveLength(0);
    expect(result.context).toBe("");
  });

  it("should combine results from multiple sources", async () => {
    let callCount = 0;
    mockFetch.mockImplementation((url: string) => {
      callCount++;
      if (url.includes("wikipedia.org")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              ["Wikipedia Result"],
              ["Wikipedia description"],
              ["https://en.wikipedia.org/wiki/Test"],
            ]),
        });
      }
      if (url.includes("api.duckduckgo.com")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              AbstractText: "DuckDuckGo result",
              Heading: "Test Query",
              AbstractURL: "https://example.com",
            }),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["wikipedia", "duckduckgo"],
      5,
      {},
    );

    expect(result.results).toHaveLength(2);
    expect(result.citations).toHaveLength(2);
    expect(result.sources).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should limit results to maxResults", async () => {
    // Mock multiple Wikipedia results
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("wikipedia.org/w/api.php")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              ["Result 1", "Result 2", "Result 3", "Result 4", "Result 5"],
              ["Desc 1", "Desc 2", "Desc 3", "Desc 4", "Desc 5"],
              ["url1", "url2", "url3", "url4", "url5"],
            ]),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    const result = await fetchWebSearchWithRanking(
      "test query",
      ["wikipedia"],
      3, // Limit to 3 results
      {},
    );

    expect(result.results).toHaveLength(3);
    expect(result.citations).toHaveLength(3);
    expect(result.sources).toHaveLength(3);
  });
});

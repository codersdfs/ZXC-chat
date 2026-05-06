import { SearchResult, Source, Citation } from "./types";

/**
 * Fetches Wikipedia search results with structured data
 */
async function fetchWikipediaResults(
  query: string,
  count: number = 3,
): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${count}&namespace=0&format=json&origin=*`;
    const response = await fetch(searchUrl);

    if (!response.ok) return [];

    const data: any = await response.json();
    const titles = data[0] || [];
    const descriptions = data[1] || [];
    const urls = data[2] || [];

    return titles.map((title: string, index: number) => ({
      title,
      url: urls[index],
      snippet: descriptions[index] || "",
      source: "wikipedia" as const,
      score: 0.7 - index * 0.1, // Wikipedia results get decent base score
    }));
  } catch (error) {
    console.error("Wikipedia search failed:", error);
    return [];
  }
}

/**
 * Fetches a short Wikipedia excerpt related to the user query (CORS-friendly).
 * Used as supplemental "web" context for the local model when web search mode is on.
 */
async function fetchWikipediaContext(query: string): Promise<string | null> {
  const results = await fetchWikipediaResults(query, 1);
  if (results.length === 0) return null;

  const result = results[0];
  if (!result.url) return null;

  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title.replace(/ /g, "_"))}`;
    const sumRes = await fetch(summaryUrl);
    if (!sumRes.ok) return null;
    const sum = (await sumRes.json()) as { extract?: string; title?: string };
    const extract = sum.extract?.trim();
    if (!extract) return null;

    const clipped =
      extract.length > 900 ? `${extract.slice(0, 900)}…` : extract;
    return `${sum.title ?? result.title}: ${clipped}`;
  } catch {
    return null;
  }
}

/**
 * Fetches DuckDuckGo search results with structured data
 */
async function fetchDuckDuckGoResults(
  query: string,
  _count: number = 3,
): Promise<SearchResult[]> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`,
    );
    const data: any = await response.json();

    if (!data.AbstractText) return [];

    return [
      {
        title: data.Heading || query,
        url: data.AbstractURL,
        snippet: data.AbstractText,
        source: "duckduckgo",
        score: 0.9, // DuckDuckGo gets high score for direct answers
      },
    ];
  } catch (e) {
    console.error("DuckDuckGo search failed:", e);
    return [];
  }
}

/**
 * Calculates relevance score for search results
 */
export function calculateRelevanceScore(
  result: SearchResult,
  query: string,
): number {
  const queryLower = query.toLowerCase();
  const titleLower = result.title.toLowerCase();
  const snippetLower = result.snippet.toLowerCase();

  // Base score from source
  let score = result.score || 0.5;

  // Title match bonus
  if (titleLower.includes(queryLower)) {
    score += 0.3;
  }

  // Snippet match bonus
  if (snippetLower.includes(queryLower)) {
    score += 0.2;
  }

  // Exact match bonus
  if (titleLower === queryLower || snippetLower === queryLower) {
    score += 0.4;
  }

  // Source-specific bonuses
  if (result.source === "wikipedia") {
    score += 0.1; // Wikipedia gets slight authority bonus
  }

  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Ranks search results by relevance
 */
export function rankSearchResults(
  results: SearchResult[],
  query: string,
): SearchResult[] {
  return results
    .map((result) => ({
      ...result,
      score: calculateRelevanceScore(result, query),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Extracts citations from search results
 */
function extractCitationsFromResults(results: SearchResult[]): {
  citations: Citation[];
  sources: Source[];
} {
  const citations: Citation[] = [];
  const sources: Source[] = [];

  results.forEach((result, index) => {
    const sourceId = `${result.source}-${index}`;

    const source: Source = {
      id: sourceId,
      type: "web",
      title: result.title,
      url: result.url,
      metadata: {
        source: result.source,
        snippet: result.snippet,
        score: result.score,
      },
    };
    sources.push(source);

    // Create citation for the snippet
    const citation: Citation = {
      id: `cit-${sourceId}`,
      text: result.snippet,
      source: source,
      position: [0, result.snippet.length], // Will be updated when inserted into content
    };
    citations.push(citation);
  });

  return { citations, sources };
}

/**
 * Fetches Google search results with structured data
 */
async function fetchGoogleResults(
  query: string,
  apiKey: string,
  cx?: string,
  count: number = 3,
): Promise<SearchResult[]> {
  if (!apiKey || !cx) {
    console.warn(
      "Google search requires API key and Custom Search Engine ID (CX)",
    );
    return [];
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&num=${count}`,
    );

    if (!response.ok) {
      console.error("Google search API error:", response.status);
      return [];
    }

    const data = await response.json();
    return (
      data.items?.map((item: any, index: number) => ({
        title: item.title || `Google Result ${index + 1}`,
        url: item.link,
        snippet: item.snippet || "",
        source: "google",
        score: 0.8 - index * 0.1, // Google results get high base score
      })) || []
    );
  } catch (error) {
    console.error("Google search error:", error);
    return [];
  }
}

/**
 * Fetches Google search results for the given query
 */
async function fetchGoogleContext(
  query: string,
  results: number = 3,
): Promise<string | null> {
  try {
    // Note: In production, you would need a Google Custom Search JSON API key
    // For this implementation, we'll use a mock or fallback to Wikipedia
    console.warn(
      "Google search requires API key configuration for query:",
      query,
      "with results:",
      results,
    );
    return null;
  } catch (e) {
    console.error("Google search failed:", e);
    return null;
  }
}

/**
 * Fetches DuckDuckGo search results for the given query
 */
async function fetchDuckDuckGoContext(
  query: string,
  _results: number = 3,
): Promise<string | null> {
  const structuredResults = await fetchDuckDuckGoResults(query);
  if (structuredResults.length === 0) return null;

  const result = structuredResults[0];
  return `[DuckDuckGo Summary]: ${result.snippet}\n\nSource: ${result.url}\n\n`;
}

/**
 * Fetches Bing search results with structured data
 */
async function fetchBingResults(
  query: string,
  apiKey: string,
  count: number = 3,
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn("Bing search requires API key");
    return [];
  }

  try {
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${count}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      },
    );

    if (!response.ok) {
      console.error("Bing search API error:", response.status);
      return [];
    }

    const data = await response.json();
    return (
      data.webPages?.value?.map((item: any, index: number) => ({
        title: item.name || `Bing Result ${index + 1}`,
        url: item.url,
        snippet: item.snippet || "",
        source: "bing",
        score: 0.75 - index * 0.1, // Bing results get slightly lower base score than Google
      })) || []
    );
  } catch (error) {
    console.error("Bing search error:", error);
    return [];
  }
}

/**
 * Fetches Bing search results for the given query
 */
async function fetchBingContext(
  query: string,
  _results: number = 3,
): Promise<string | null> {
  try {
    // Note: In production, you would need Bing Search API key
    // For this implementation, we'll use a mock or fallback to Wikipedia
    console.warn(
      "Bing search requires API key configuration for query:",
      query,
      "with results:",
      _results,
    );
    return null;
  } catch (e) {
    console.error("Bing search failed:", e);
    return null;
  }
}

function hasGoogleCredentials(
  apiKeys: { google?: { apiKey: string; cx: string }; bing?: string },
) {
  return Boolean(apiKeys.google?.apiKey && apiKeys.google?.cx);
}

function hasBingCredentials(
  apiKeys: { google?: { apiKey: string; cx: string }; bing?: string },
) {
  return Boolean(apiKeys.bing);
}

export function determineSearchSources(
  query: string,
  apiKeys: { google?: { apiKey: string; cx: string }; bing?: string } = {},
): ("wikipedia" | "google" | "duckduckgo" | "bing")[] {
  const normalized = query.toLowerCase();
  const timeSensitivePattern = /\b(today|now|current|recent|latest|news|breaking|weather|forecast|stock|price|market|quote|live|earnings|score|rank|headlines|update|time|date|tonight|tomorrow|yesterday)\b/;
  const encyclopedicPattern = /\b(define|definition|meaning|history|origin|background|biography|who was|who is|what is|what are|when was|first|ancient|overview|explain|concept|theory|encyclopedia|wiki|article)\b/;

  const useGoogle = hasGoogleCredentials(apiKeys);
  const useBing = hasBingCredentials(apiKeys);
  const isTimeSensitive = timeSensitivePattern.test(normalized);
  const isEncyclopedic = encyclopedicPattern.test(normalized);

  if (isEncyclopedic && !isTimeSensitive) {
    const sources: ("wikipedia" | "google" | "duckduckgo" | "bing")[] = ["wikipedia", "duckduckgo"];
    if (useGoogle) sources.push("google");
    if (useBing) sources.push("bing");
    return [...new Set(sources)];
  }

  const sources: ("wikipedia" | "google" | "duckduckgo" | "bing")[] = [];
  if (useGoogle) sources.push("google");
  sources.push("duckduckgo");
  if (useBing) sources.push("bing");
  sources.push("wikipedia");

  return [...new Set(sources)];
}

/**
 * Unified web search function that supports multiple search sources
 */
export async function fetchWebSearchContext(
  query: string,
  source: "wikipedia" | "google" | "duckduckgo" | "bing" = "wikipedia",
  results: number = 3,
): Promise<string | null> {
  try {
    switch (source) {
      case "wikipedia":
        return await fetchWikipediaContext(query);
      case "google":
        return await fetchGoogleContext(query, results);
      case "duckduckgo":
        return await fetchDuckDuckGoContext(query, results);
      case "bing":
        return await fetchBingContext(query, results);
      default:
        return null;
    }
  } catch (e) {
    console.warn(`Web search (${source}) failed:`, e);
    return null;
  }
}

/**
 * Enhanced web search with multiple sources, ranking, and citation extraction
 */
export async function fetchWebSearchWithRanking(
  query: string,
  searchSources: ("wikipedia" | "google" | "duckduckgo" | "bing")[] = [
    "wikipedia",
    "duckduckgo",
  ],
  maxResults: number = 5,
  apiKeys: { google?: { apiKey: string; cx: string }; bing?: string } = {},
): Promise<{
  results: SearchResult[];
  citations: Citation[];
  sources: Source[];
  context: string;
}> {
  try {
    // Fetch from all sources in parallel
    const fetchPromises = searchSources.map(async (source) => {
      try {
        switch (source) {
          case "wikipedia":
            return await fetchWikipediaResults(query, maxResults);
          case "duckduckgo":
            return await fetchDuckDuckGoResults(query, maxResults);
          case "google":
            return await fetchGoogleResults(
              query,
              apiKeys.google?.apiKey || "",
              apiKeys.google?.cx,
              maxResults,
            );
          case "bing":
            return await fetchBingResults(
              query,
              apiKeys.bing || "",
              maxResults,
            );
          default:
            return [];
        }
      } catch (error) {
        console.error(`Search from ${source} failed:`, error);
        return [];
      }
    });

    // Wait for all searches to complete
    const allResults = await Promise.all(fetchPromises);
    const combinedResults = allResults.flat();

    if (combinedResults.length === 0) {
      return { results: [], citations: [], sources: [], context: "" };
    }

    // Rank results by relevance
    const rankedResults = rankSearchResults(combinedResults, query);
    const topResults = rankedResults.slice(0, maxResults);

    // Extract citations and sources
    const { citations, sources } = extractCitationsFromResults(topResults);

    // Create context string for LLM
    const context = topResults
      .map(
        (result, index) =>
          `[Web Search Result ${index + 1} (${result.source}) - Relevance: ${result.score?.toFixed(2)}]` +
          `\nTitle: ${result.title}` +
          (result.url ? `\nURL: ${result.url}` : "") +
          `\nContent: ${result.snippet}\n\n`,
      )
      .join("\n");

    return { results: topResults, citations, sources, context };
  } catch (error) {
    console.error("Enhanced web search failed:", error);
    return { results: [], citations: [], sources: [], context: "" };
  }
}

// Export original function for backward compatibility
export { fetchWikipediaContext };

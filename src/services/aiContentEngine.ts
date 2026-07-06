// src/services/aiContentEngine.ts

/**
 * Service to manage AI-generated match content.
 * Delegated to server-side API for security (Gemini API access).
 */
export const aiContentEngine = {
  /**
   * Fetches existing AI-generated content or triggers generation if needed.
   * Server-side API handles Firestore caching and Gemini generation.
   */
  async getMatchContent(matchId: string, matchData?: any) {
    console.log(`[AI Content] Fetching for match: ${matchId}`);
    try {
      const url = `/api/matches/${matchId}/ai-content`;
      console.log(`[AI Content] URL: ${url}`);
      
      let response;
      if (matchData) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchData })
        });
      } else {
        response = await fetch(url);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error(`[AI Content] Response not OK: ${response.status} ${response.statusText}`, errData);
        throw new Error(`Failed to fetch AI content: ${errData.error || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error in aiContentEngine.getMatchContent:", error);
      return null;
    }
  }
};

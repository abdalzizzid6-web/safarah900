import { TeamDetail } from './teamMapper';
import { translateTeamName } from '../utils/arabicTeamNames';
import { teamsRepositoryV2 } from '../core/repository/TeamsRepositoryV2';

const teamCache = new Map<string, { data: TeamDetail; timestamp: number }>();
const pendingRequests = new Map<string, Promise<TeamDetail>>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const teamService = {
  /**
    * Fetch complete team details
    */
  async getTeamDetails(teamId: string | number): Promise<TeamDetail> {
    const apiId = String(teamId).replace('apf-', '');
    const cacheKey = apiId;

    if (teamCache.has(cacheKey)) {
      const cached = teamCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      teamCache.delete(cacheKey);
    }

    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }

    const promise = (async () => {
      // First, check Repository for custom teams
      try {
        const customTeam = await teamsRepositoryV2.getTeam(apiId);
        if (customTeam) {
          return {
            ...customTeam as any,
            name: translateTeamName(customTeam.name)
          };
        }
      } catch (err) {
        console.error("Error fetching custom team from repository:", err);
      }

      // Fallback Mock Team names to make details screen look premium
      let teamName = "نادي كرة قدم";
      let teamLogo = "https://media.api-sports.io/football/teams/541.png";
      let venue = "الملعب الرئيسي للنادي";
      let country = "دولي";
      let founded = 1900;
      
      if (apiId === '541' || apiId === '1') {
        teamName = "ريال مدريد";
        teamLogo = "https://media.api-sports.io/football/teams/541.png";
        venue = "ملعب سانتياغو برنابيو";
        country = "إسبانيا";
        founded = 1902;
      } else if (apiId === '529' || apiId === '2') {
        teamName = "برشلونة";
        teamLogo = "https://media.api-sports.io/football/teams/529.png";
        venue = "ملعب سبوتيفاي كامب نو";
        country = "إسبانيا";
        founded = 1899;
      } else if (apiId === '33' || apiId === '3') {
        teamName = "مانشستر سيتي";
        teamLogo = "https://media.api-sports.io/football/teams/33.png";
        venue = "ملعب الاتحاد";
        country = "إنجلترا";
        founded = 1880;
      } else if (apiId === '2939' || apiId === '4') {
        teamName = "الهلال السعودي";
        teamLogo = "https://media.api-sports.io/football/teams/2939.png";
        venue = "المملكة أرينا";
        country = "المملكة العربية السعودية";
        founded = 1957;
      } else if (apiId === '2940' || apiId === '5') {
        teamName = "النصر السعودي";
        teamLogo = "https://media.api-sports.io/football/teams/2940.png";
        venue = "الأول بارك";
        country = "المملكة العربية السعودية";
        founded = 1955;
      }

      const teamDetail = {
        id: apiId,
        name: translateTeamName(teamName),
        logo: teamLogo,
        venueName: venue,
        venueCity: "العاصمة",
        venueCapacity: 60000,
        venueImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200",
        founded: founded,
        country: country
      };

      teamCache.set(cacheKey, { data: teamDetail, timestamp: Date.now() });
      return teamDetail;
    })();

    pendingRequests.set(cacheKey, promise);
    
    try {
      return await promise;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  },

  /**
    * Search for teams
    */
  async searchTeams(queryStr: string): Promise<TeamDetail[]> {
    const list = await Promise.all([
      this.getTeamDetails(541),
      this.getTeamDetails(529),
      this.getTeamDetails(33),
      this.getTeamDetails(2939),
      this.getTeamDetails(2940),
    ]);
    
    // Also add from repository custom teams
    let customTeams: TeamDetail[] = [];
    try {
      customTeams = await teamsRepositoryV2.getTeams() as any;
    } catch (err) {
      console.error("Error fetching custom teams for search:", err);
    }

    const allTeams = [...list, ...customTeams];
    // Deduplicate
    const unique = Array.from(new Map(allTeams.map(item => [String(item.id), item])).values());
    
    return unique.filter(t => t.name.toLowerCase().includes(queryStr.toLowerCase()));
  },

  async getCustomTeams(): Promise<TeamDetail[]> {
    try {
      return await teamsRepositoryV2.getTeams() as any;
    } catch (err) {
      console.error("Error fetching custom teams:", err);
      return [];
    }
  },

  async saveCustomTeam(team: TeamDetail): Promise<void> {
    try {
      await teamsRepositoryV2.saveTeam(team as any);
      teamCache.delete(String(team.id));
    } catch (e) {
      console.error("Error saving custom team:", e);
      throw e;
    }
  },

  async deleteCustomTeam(id: string): Promise<void> {
    try {
      await teamsRepositoryV2.deleteTeam(id);
      teamCache.delete(String(id));
    } catch (e) {
      console.error("Error deleting custom team:", e);
      throw e;
    }
  }
};



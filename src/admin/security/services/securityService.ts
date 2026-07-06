import { getAuth } from 'firebase/auth';

export const securityService = {
  async fetchSecurityAudits(retries = 3, delay = 2000): Promise<any> {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch('/api/admin/security/audits', { headers });
    
    if (res.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchSecurityAudits(retries - 1, delay * 2);
    }
    
    if (!res.ok) {
      throw new Error(`خطأ في جلب السجلات: ${res.status}`);
    }
    
    return await res.json();
  },

  async simulateSSRF() {
    const payload = { url: 'http://169.254.169.254/latest/meta-data/' };
    return await fetch('/api/rss/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async simulateUnauthorized() {
    return await fetch('/api/imagekit/diagnostics', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async simulateValidation() {
    const payload = {
      homeTeam: "",
      awayTeam: "",
      league: "لا توجد بطولة"
    };
    return await fetch('/api/predict/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
};

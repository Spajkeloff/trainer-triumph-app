import { clientService } from "./clientService";
import { sessionService } from "./sessionService";
import { financeService } from "./financeService";

export const dashboardService = {
  async getStats() {
    try {
      // Get all stats in parallel
      const [clientStats, sessionStats, financialStats] = await Promise.all([
        clientService.getStats(),
        sessionService.getStats(),
        financeService.getFinancialStats()
      ]);

      return {
        clients: clientStats,
        sessions: sessionStats,
        financial: financialStats
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getUpcomingSessions(limit = 5) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const sessions = await sessionService.getByDateRange(today, nextWeekStr);
      
      return sessions
        .filter(s => s.status === 'scheduled')
        .slice(0, limit)
        .map(session => ({
          id: session.id,
          date: new Date(session.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          client: `${session.clients.first_name} ${session.clients.last_name}`,
          location: session.location || 'Main Gym',
          duration: `${session.duration || 60} min`,
          status: session.status,
          type: session.type
        }));
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      return [];
    }
  },

  async getRecentSessions(limit = 5) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      const sessions = await sessionService.getByDateRange(lastWeekStr, today);
      
      return sessions
        .filter(s => s.status === 'completed')
        .slice(-limit)
        .reverse()
        .map(session => ({
          id: session.id,
          date: new Date(session.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          time: new Date(`2000-01-01T${session.start_time}`).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }),
          client: `${session.clients.first_name} ${session.clients.last_name}`,
          location: session.location || 'Main Gym',
          duration: `${session.duration || 60} min`,
          status: session.status,
          type: session.type
        }));
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
  }
};
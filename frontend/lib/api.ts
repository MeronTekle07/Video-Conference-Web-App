const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // User methods
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(userData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Meeting methods
  async getMyMeetings() {
    return this.request('/meetings/my');
  }

  async createMeeting(meetingData: any) {
    return this.request('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData),
    });
  }

  async getMeeting(id: string) {
    return this.request(`/meetings/${id}`);
  }

  async joinMeeting(id: string) {
    return this.request(`/meetings/${id}/join`, {
      method: 'POST',
    });
  }

  async leaveMeeting(id: string) {
    return this.request(`/meetings/${id}/leave`, {
      method: 'POST',
    });
  }

  // Calendar methods
  async getCalendarEvents() {
    return this.request('/calendar/events');
  }

  async createCalendarEvent(eventData: any) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Settings methods
  async getUserSettings() {
    return this.request('/settings');
  }

  async updateUserSettings(settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Contacts methods
  async getUserContacts() {
    return this.request('/contacts');
  }

  async addContact(contactUserId: string) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify({ contactUserId }),
    });
  }

  async removeContact(contactId: string) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async toggleFrequentContact(contactId: string) {
    return this.request(`/contacts/${contactId}/frequent`, {
      method: 'PATCH',
    });
  }

  async searchUsers(query: string) {
    return this.request(`/contacts/search?query=${encodeURIComponent(query)}`);
  }

  // Admin methods
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getSystemAlerts() {
    return this.request('/admin/alerts');
  }

  async getRecentActivity() {
    return this.request('/admin/activity');
  }

  async getSecurityEvents() {
    return this.request('/admin/security/events');
  }

  async getSecuritySettings() {
    return this.request('/admin/security/settings');
  }

  async updateSecuritySettings(settings: any) {
    return this.request('/admin/security/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getMeetingStats() {
    return this.request('/admin/meeting-stats');
  }

  // Admin user management methods
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async createUser(userData: any) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async changeUserPassword(userId: string, newPassword: string) {
    return this.request(`/admin/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: newPassword }),
    });
  }

  // Analytics methods
  async getAnalytics(dateRange: string) {
    return this.request(`/admin/analytics?dateRange=${dateRange}`);
  }

  // Calendar event deletion method
  async deleteCalendarEvent(eventId: string) {
    return this.request(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;

import { buildApiUrl } from '../config/api';

// API Response types (should match server types)
interface CoachCreateRequest {
  name: string;
  email: string;
  password: string;
  nickname: string;
}

interface CoachCreateResponse {
  coachId: string;
  token: string;
  valid: boolean;
}

interface CoachLoginRequest {
  email: string;
  password: string;
}

interface CoachLoginResponse {
  coachId: string;
  token: string;
  valid: boolean;
}

interface CoachGetResponse {
  coachId: string;
  name: string;
  email: string;
  createdAt: string;
  valid: boolean;
  nickname: string;
  phone?: string;
  age?: number;
}

interface CoachUpdateRequest {
  name?: string;
  phone?: string;
  age?: number;
}

interface CoachUpdateResponse {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  phone?: string;
  age?: number;
  updatedAt: string;
}

interface NicknameCheckResponse {
  available: boolean;
  reason?: string;
}

// API Service Class
export class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Nickname validation
  async checkNickname(nickname: string): Promise<NicknameCheckResponse> {
    return this.makeRequest<NicknameCheckResponse>(`/nicknames/check?nickname=${encodeURIComponent(nickname)}`);
  }

  // Coach authentication
  async createCoach(name: string, email: string, password: string, nickname: string): Promise<CoachCreateResponse> {
    const requestData: CoachCreateRequest = { name, email, password, nickname };
    return this.makeRequest<CoachCreateResponse>('/coaches', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async loginCoach(email: string, password: string): Promise<CoachLoginResponse> {
    const requestData: CoachLoginRequest = { email, password };
    return this.makeRequest<CoachLoginResponse>('/auth/coach/login', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Coach profile management
  async getCoach(coachId: string, token: string): Promise<CoachGetResponse> {
    return this.makeRequest<CoachGetResponse>(`/coaches/${coachId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateCoach(coachId: string, token: string, updateData: CoachUpdateRequest): Promise<CoachUpdateResponse> {
    return this.makeRequest<CoachUpdateResponse>(`/coaches/${coachId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
  }
}

// Export a singleton instance
export const apiService = new ApiService();

// Export individual functions for convenience
export const checkNickname = (nickname: string) => apiService.checkNickname(nickname);
export const createCoach = (name: string, email: string, password: string, nickname: string) => 
  apiService.createCoach(name, email, password, nickname);
export const loginCoach = (email: string, password: string) => apiService.loginCoach(email, password);
export const getCoach = (coachId: string, token: string) => apiService.getCoach(coachId, token);
export const updateCoach = (coachId: string, token: string, updateData: CoachUpdateRequest) => 
  apiService.updateCoach(coachId, token, updateData);

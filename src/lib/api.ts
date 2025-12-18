import type { 
  Post, 
  PaginatedResponse, 
  ApiResponse,
  CreatePostRequest,
  UpdatePostRequest,
  LoginRequest,
  AuthResponse,
  Revision,
  Comment,
  CreateCommentRequest
} from '@/types/api';

const API_BASE_URL = 'https://lael-blog-api.wini.workers.dev';

// Custom error classes
export class RateLimitError extends Error {
  status = 429;
  retryAfter: number;
  
  constructor(message: string, retryAfter: number = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ApiError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private rateLimitedUntil: number = 0;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth-token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth-token', token);
    } else {
      localStorage.removeItem('auth-token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('refresh-token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const newAccessToken = data.accessToken;
        
        if (newAccessToken) {
          this.setToken(newAccessToken);
          return newAccessToken;
        }

        throw new Error('No access token in response');
      } catch (error) {
        // Clear tokens and redirect to login
        this.setToken(null);
        localStorage.removeItem('refresh-token');
        
        // Redirect to login page if not already there
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
        
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean; skipRateLimitCheck?: boolean } = {}
  ): Promise<T> {
    // Check if we're currently rate limited
    if (!options.skipRateLimitCheck && this.rateLimitedUntil > Date.now()) {
      const waitSeconds = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
      throw new RateLimitError(
        `요청이 너무 많습니다. ${waitSeconds}초 후에 다시 시도해주세요.`,
        waitSeconds
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Don't set Content-Type for FormData - let browser set it automatically
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists and not skipping auth
    if (this.token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for auth
    });

    // Handle 429 - Rate Limit
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      this.rateLimitedUntil = Date.now() + (retryAfter * 1000);
      
      const errorData = await response.json().catch(() => ({ 
        error: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } 
      }));
      
      throw new RateLimitError(
        errorData.error?.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter
      );
    }

    // Handle 401 - Token expired or invalid
    if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
      const newToken = await this.refreshAccessToken();
      
      if (newToken) {
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        
        // Check for rate limit on retry
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          this.rateLimitedUntil = Date.now() + (retryAfter * 1000);
          
          const errorData = await response.json().catch(() => ({ 
            error: { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' } 
          }));
          
          throw new RateLimitError(
            errorData.error?.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            retryAfter
          );
        }
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: { message: 'Request failed', code: 'UNKNOWN_ERROR', status: response.status } 
      }));
      
      // Create custom error with status information
      throw new ApiError(
        errorData.error?.message || 'Request failed',
        response.status,
        errorData.error?.code || 'UNKNOWN_ERROR'
      );
    }

    return response.json();
  }

  // Check if currently rate limited
  isRateLimited(): boolean {
    return this.rateLimitedUntil > Date.now();
  }

  // Get seconds until rate limit expires
  getRateLimitWaitTime(): number {
    if (!this.isRateLimited()) return 0;
    return Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
  }

  // Clear rate limit (for testing or manual override)
  clearRateLimit(): void {
    this.rateLimitedUntil = 0;
  }

  // Posts API
  async getPosts(page = 1, limit = 10, published = true, postType?: 'post' | 'page'): Promise<PaginatedResponse<Post>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(published && { published: 'true' }),
      ...(postType && { type: postType }),
    });
    return this.request(`/api/posts?${params}`);
  }

  // Pages API (convenience methods)
  async getPages(page = 1, limit = 10, published = true): Promise<PaginatedResponse<Post>> {
    return this.getPosts(page, limit, published, 'page');
  }

  async getPage(id: number): Promise<ApiResponse<Post>> {
    return this.getPost(id);
  }

  async getPageBySlug(slug: string): Promise<ApiResponse<Post>> {
    return this.request(`/api/posts?slug=${slug}&type=page`);
  }

  async createPage(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.createPost({ ...data, postType: 'page' });
  }

  async updatePage(id: number, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return this.updatePost(id, { ...data, postType: 'page' });
  }

  async deletePage(id: number): Promise<void> {
    return this.deletePost(id);
  }

  async getPost(id: number): Promise<ApiResponse<Post>> {
    return this.request(`/api/posts/${id}`);
  }


  async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: number, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return this.request(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: number): Promise<void> {
    return this.request(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Revisions API
  async getRevisions(postId: number, page = 1, limit = 20): Promise<PaginatedResponse<Revision>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/api/posts/${postId}/revisions?${params}`);
  }

  async getRevision(postId: number, revisionId: number): Promise<ApiResponse<Revision>> {
    return this.request(`/api/posts/${postId}/revisions/${revisionId}`);
  }

  async restoreRevision(postId: number, revisionId: number): Promise<ApiResponse<Post> & { message: string }> {
    return this.request(`/api/posts/${postId}/revisions/${revisionId}/restore`, {
      method: 'POST',
    });
  }

  // Auth API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store accessToken if present
    if (response.accessToken) {
      this.setToken(response.accessToken);
    }
    
    // Store refreshToken in localStorage for future use
    if (response.refreshToken) {
      localStorage.setItem('refresh-token', response.refreshToken);
    }
    
    return response;
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await this.request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
    
    // Clear token on logout
    this.setToken(null);
    
    return response;
  }

  async checkAuth(): Promise<AuthResponse> {
    return this.request('/api/auth/me');
  }

  // Health Check API
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health');
  }

  // Comments API
  async getComments(postId: number, page = 1, limit = 20, tree = true): Promise<{
    data: Comment[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(tree && { tree: 'true' }),
    });
    
    const response = await this.request<any>(`/api/comments/post/${postId}?${params}`);
    
    // 안전한 데이터 구조 보장
    return {
      data: Array.isArray(response.data) ? response.data : [],
      total: response.total || 0,
      pagination: response.pagination,
    };
  }

  async createComment(data: CreateCommentRequest): Promise<{
    data: Comment;
    message: string;
  }> {
    return this.request('/api/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(id: number, data: {
    authorName?: string;
    authorEmail?: string;
    authorWebsite?: string;
    content?: string;
    status?: 'pending' | 'approved' | 'spam' | 'trash';
  }): Promise<{ data: Comment }> {
    return this.request(`/api/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: number): Promise<{ message: string }> {
    return this.request(`/api/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async moderateComment(id: number, status: 'approved' | 'spam' | 'trash'): Promise<{
    data: Comment;
    message: string;
  }> {
    return this.request(`/api/comments/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Admin Comments Management
  async getAdminComments(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'spam' | 'trash';
    postId?: number;
  }): Promise<{
    success: boolean;
    data: {
      comments: Array<Comment & { post_title?: string; post_slug?: string }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.postId) searchParams.set('postId', params.postId.toString());

    const queryString = searchParams.toString();
    const url = `/api/admin/comments${queryString ? `?${queryString}` : ''}`;
    
    return this.request(url);
  }

  async getCommentStats(): Promise<{
    success: boolean;
    data: {
      total: number;
      pending: number;
      approved: number;
      spam: number;
      trash: number;
      recent: number;
    };
  }> {
    return this.request('/api/admin/comments/stats');
  }

  // Schema Management API
  async validateSchema(): Promise<{
    valid: boolean;
    issues: Array<{
      type: 'missing_table' | 'missing_column' | 'missing_index' | 'wrong_type' | 'missing_constraint';
      severity: 'error' | 'warning';
      table?: string;
      column?: string;
      index?: string;
      expected: string;
      actual?: string;
      fixable: boolean;
      fixQuery?: string;
    }>;
    tablesCount: number;
    indexesCount: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data?: {
        valid?: boolean;
        issues?: any[];
        tablesCount?: number;
        indexesCount?: number;
      };
    }>('/api/admin/schema/validate');
    
    // 안전한 데이터 구조 보장
    const data = response.data || {};
    return {
      valid: data.valid || false,
      issues: Array.isArray(data.issues) ? data.issues : [],
      tablesCount: data.tablesCount || 0,
      indexesCount: data.indexesCount || 0,
    };
  }

  async fixSchema(issues?: any[]): Promise<{
    fixed: number;
    failed: string[];
    message: string;
  }> {
    // issues가 제공되지 않으면 현재 검증 결과에서 수정 가능한 이슈들을 가져옴
    let issuesToFix = issues;
    if (!issuesToFix) {
      const validation = await this.validateSchema();
      issuesToFix = validation.issues.filter(issue => issue.fixable);
    }

    const response = await this.request<{
      success: boolean;
      data: {
        fixed: number;
        failed: string[];
        message: string;
      };
    }>('/api/admin/schema/fix', {
      method: 'POST',
      body: JSON.stringify({ issues: issuesToFix }),
    });
    
    return response.data || { fixed: 0, failed: [], message: 'No data returned' };
  }

  async getDatabaseInfo(): Promise<{
    tables: Array<{ name: string }>;
    indexes: Array<{ name: string; tbl_name: string }>;
    tableStats: Array<{ name: string; rowCount: number }>;
    totalTables: number;
    totalIndexes: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data?: {
        tables?: any[];
        indexes?: any[];
        tableStats?: any[];
        totalTables?: number;
        totalIndexes?: number;
      };
    }>('/api/admin/database/info');
    
    const data = response.data || {};
    return {
      tables: Array.isArray(data.tables) ? data.tables : [],
      indexes: Array.isArray(data.indexes) ? data.indexes : [],
      tableStats: Array.isArray(data.tableStats) ? data.tableStats : [],
      totalTables: data.totalTables || 0,
      totalIndexes: data.totalIndexes || 0,
    };
  }
  // Site Settings API
  async getSiteSettings() {
    return this.request<Record<string, string>>('/api/admin/settings');
  }

  async updateSiteSettings(settings: Record<string, string>) {
    return this.request<{ message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Public Site Settings API (no auth required)
  async getPublicSiteSettings() {
    const response = await this.request<{ 
      success: boolean; 
      data: { site_title: string; site_tagline: string; favicon_url: string } 
    }>('/api/site-settings', {
      skipAuth: true,
    });
    return response.data;
  }

  // Presigned URL API
  async getPresignedUrl(filename: string, contentType: string, fileSize: number, uploadType: string) {
    return this.request<{
      presignedUrl: string;
      tempKey: string;
      finalKey: string;
      uniqueFilename: string;
      expiresIn: number;
    }>('/api/admin/upload/presigned', {
      method: 'POST',
      body: JSON.stringify({
        filename,
        contentType,
        fileSize,
        uploadType,
      }),
    });
  }

  async uploadToR2(presignedUrl: string, file: File, isDirect = false) {
    if (isDirect) {
      // Direct upload through worker
      const formData = new FormData();
      formData.append('file', file);

      return this.request<{
        tempKey: string;
        message: string;
      }>(presignedUrl, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Real presigned URL upload
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response;
    }
  }

  async confirmUpload(tempKey: string, finalKey: string, uploadType: string, uniqueFilename: string) {
    return this.request<{
      success: boolean;
      data: {
        url: string;
        filename: string;
        size: number;
        type: string;
      };
      message: string;
    }>('/api/admin/upload/confirm', {
      method: 'POST',
      body: JSON.stringify({
        tempKey,
        finalKey,
        uploadType,
        uniqueFilename,
      }),
    });
  }

  // High-level upload function
  async uploadFile(file: File, uploadType: string) {
    try {
      // Step 1: Get presigned URL
      const presignedResponse = await this.getPresignedUrl(
        file.name,
        file.type,
        file.size,
        uploadType
      );

      const presignedData = (presignedResponse as any).data;

      // Step 2: Upload directly to R2 using presigned URL or fallback
      await this.uploadToR2(presignedData.presignedUrl, file, presignedData.isDirect);

      // Step 3: Confirm upload and move file
      const confirmResponse = await this.confirmUpload(
        presignedData.tempKey,
        presignedData.finalKey,
        uploadType,
        presignedData.uniqueFilename
      );

      return confirmResponse;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Convenience method for favicon upload
  async uploadFavicon(file: File) {
    return this.uploadFile(file, 'favicon');
  }

  // Menu Management API
  async getMenus(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/api/menus');
  }

  async getMenu(id: number): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/menus/${id}`);
  }

  async getMenuBySlug(slug: string): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/menus/slug/${slug}`, { skipAuth: true });
  }

  async createMenu(data: { name: string; slug: string; description?: string }): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenu(id: number, data: { name?: string; slug?: string; description?: string }): Promise<{ success: boolean; data: any; message: string }> {
    return this.request(`/api/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenu(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/menus/${id}`, {
      method: 'DELETE',
    });
  }

  async getMenuItems(menuId: number): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/api/menus/${menuId}/items`);
  }

  async createMenuItem(menuId: number, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request(`/api/menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuItem(menuId: number, itemId: number, data: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request(`/api/menus/${menuId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuItem(menuId: number, itemId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/menus/${menuId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async reorderMenuItems(menuId: number, items: { id: number; sortOrder: number }[]): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/menus/${menuId}/items/reorder`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

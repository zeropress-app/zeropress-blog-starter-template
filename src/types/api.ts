/**
 * Blog Backend API Types
 * 
 * Frontend 개발자가 사용할 수 있는 TypeScript 타입 정의
 * 이 파일을 Frontend 프로젝트에 복사하여 사용하세요.
 */

// ===== 데이터 모델 =====

export type PostType = 'post' | 'page';
export type ContentFormat = 'html' | 'markdown' | 'visual';

export interface Post {
  id: number;
  title: string;
  content: string;
  contentFormat: ContentFormat;
  summary?: string;
  slug: string;
  postType: PostType;
  parentId?: number;
  menuOrder: number;
  pageTemplate?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  published: boolean;
}

export interface Admin {
  id: number;
  email: string;
}

export interface Revision {
  id: number;
  postId: number;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  published: boolean;
  revisionType: string;
  createdAt: string;
  createdBy: number;
}

export interface Comment {
  id: number;
  postId: number;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'trash';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: number;
  replies?: Comment[];
}

// ===== 요청 DTO =====

export interface CreatePostRequest {
  title: string;
  content: string;
  contentFormat?: ContentFormat;
  summary?: string;
  slug?: string;
  postType?: PostType;
  parentId?: number;
  menuOrder?: number;
  pageTemplate?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  contentFormat?: ContentFormat;
  summary?: string;
  slug?: string;
  published?: boolean;
  postType?: PostType;
  parentId?: number;
  menuOrder?: number;
  pageTemplate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
}

export interface CreateCommentRequest {
  postId: number;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
  parentId?: number;
}

// ===== 응답 타입 =====

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  admin?: Admin;
  accessToken?: string;
  refreshToken?: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface AdminCreateResponse extends SuccessResponse {
  admin?: Admin;
}

// ===== 에러 타입 =====

export interface ApiError {
  error: {
    message: string;
    code: string;
    status: number;
  };
}

// ===== API 클라이언트 타입 =====

export interface PostsQueryParams {
  page?: number;
  limit?: number;
  published?: 'true';
}

// ===== 에러 코드 상수 =====

export const ERROR_CODES = {
  // 공통
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  INVALID_PAGINATION: 'INVALID_PAGINATION',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  
  // 포스트
  INVALID_POST_ID: 'INVALID_POST_ID',
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  SLUG_CONFLICT: 'SLUG_CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  POST_FETCH_ERROR: 'POST_FETCH_ERROR',
  POST_CREATE_ERROR: 'POST_CREATE_ERROR',
  POST_UPDATE_ERROR: 'POST_UPDATE_ERROR',
  POST_DELETE_ERROR: 'POST_DELETE_ERROR',
  
  // 인증
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  LOGIN_SERVER_ERROR: 'LOGIN_SERVER_ERROR',
  LOGOUT_ERROR: 'LOGOUT_ERROR',
  AUTH_VERIFICATION_ERROR: 'AUTH_VERIFICATION_ERROR',
  
  // 관리자
  MISSING_PASSWORDS: 'MISSING_PASSWORDS',
  PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
  MISSING_ADMIN_DATA: 'MISSING_ADMIN_DATA',
  ADMIN_CREATE_FAILED: 'ADMIN_CREATE_FAILED',
  ADMIN_CONTEXT_ERROR: 'ADMIN_CONTEXT_ERROR',
  PASSWORD_CHANGE_ERROR: 'PASSWORD_CHANGE_ERROR',
  ADMIN_CREATE_ERROR: 'ADMIN_CREATE_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ===== API 클라이언트 인터페이스 예시 =====

export interface BlogApiClient {
  // Posts
  getPosts(params?: PostsQueryParams): Promise<PaginatedResponse<Post>>;
  getPost(id: number): Promise<ApiResponse<Post>>;
  createPost(data: CreatePostRequest): Promise<ApiResponse<Post>>;
  updatePost(id: number, data: UpdatePostRequest): Promise<ApiResponse<Post>>;
  deletePost(id: number): Promise<SuccessResponse>;
  
  // Auth
  login(data: LoginRequest): Promise<AuthResponse>;
  logout(): Promise<SuccessResponse>;
  getMe(): Promise<{ success: boolean; admin: Admin | null }>;
  
  // Admin
  changePassword(data: ChangePasswordRequest): Promise<SuccessResponse>;
  createAdmin(data: CreateAdminRequest): Promise<AdminCreateResponse>;
}
import { ComponentType } from 'react';

export interface Post {
  id: number;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  screenshot: string;
  templates: {
    Home: ComponentType;
    PostDetail: ComponentType;
    NotFound: ComponentType;
  };
  components: {
    Navbar: ComponentType;
    Footer: ComponentType;
    PostCard: ComponentType<{ post: Post; variant?: 'grid' | 'list' }>;
  };
  styles?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
}

export interface ThemeMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  screenshot: string;
}

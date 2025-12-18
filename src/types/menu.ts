export interface Menu {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: number;
  menuId: number;
  parentId?: number;
  title: string;
  type: 'hyperlink' | 'post';
  url?: string;
  postId?: number;
  target: string;
  cssClasses?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateMenuRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export interface CreateMenuItemRequest {
  title: string;
  type: 'hyperlink' | 'post';
  url?: string;
  postId?: number;
  parentId?: number;
  target?: string;
  cssClasses?: string;
  sortOrder?: number;
}

export interface UpdateMenuItemRequest {
  title?: string;
  type?: 'hyperlink' | 'post';
  url?: string;
  postId?: number;
  parentId?: number;
  target?: string;
  cssClasses?: string;
  sortOrder?: number;
}

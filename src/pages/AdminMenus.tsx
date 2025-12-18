import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, Link as LinkIcon, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Menu, MenuItem } from "@/types/menu";

const AdminMenus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Menu form state
  const [menuForm, setMenuForm] = useState({ name: "", slug: "", description: "" });
  
  // Menu item form state
  const [itemForm, setItemForm] = useState({
    title: "",
    type: "hyperlink" as "hyperlink" | "post",
    url: "",
    postId: "",
    target: "_self",
    cssClasses: "",
  });

  // Fetch menus
  const { data: menusData } = useQuery({
    queryKey: ["menus"],
    queryFn: () => api.getMenus(),
  });

  const menus = menusData?.data || [];

  // Fetch menu items for selected menu
  const { data: itemsData } = useQuery({
    queryKey: ["menu-items", selectedMenu],
    queryFn: () => selectedMenu ? api.getMenuItems(selectedMenu) : null,
    enabled: !!selectedMenu,
  });

  const items = itemsData?.data || [];

  // Fetch posts for dropdown
  const { data: postsData } = useQuery({
    queryKey: ["posts-for-menu"],
    queryFn: () => api.getPosts(1, 100, false),
  });

  const posts = postsData?.data || [];

  // Create menu mutation
  const createMenuMutation = useMutation({
    mutationFn: (data: typeof menuForm) => api.createMenu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast({ title: "메뉴가 생성되었습니다" });
      setIsCreateMenuOpen(false);
      setMenuForm({ name: "", slug: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "메뉴 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete menu mutation
  const deleteMenuMutation = useMutation({
    mutationFn: (id: number) => api.deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast({ title: "메뉴가 삭제되었습니다" });
      if (selectedMenu === deleteMenuMutation.variables) {
        setSelectedMenu(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "메뉴 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create menu item mutation
  const createItemMutation = useMutation({
    mutationFn: (data: any) => api.createMenuItem(selectedMenu!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", selectedMenu] });
      toast({ title: "메뉴 항목이 생성되었습니다" });
      setIsCreateItemOpen(false);
      resetItemForm();
    },
    onError: (error: any) => {
      toast({
        title: "메뉴 항목 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update menu item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) =>
      api.updateMenuItem(selectedMenu!, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", selectedMenu] });
      toast({ title: "메뉴 항목이 수정되었습니다" });
      setEditingItem(null);
      resetItemForm();
    },
    onError: (error: any) => {
      toast({
        title: "메뉴 항목 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete menu item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => api.deleteMenuItem(selectedMenu!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items", selectedMenu] });
      toast({ title: "메뉴 항목이 삭제되었습니다" });
    },
    onError: (error: any) => {
      toast({
        title: "메뉴 항목 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetItemForm = () => {
    setItemForm({
      title: "",
      type: "hyperlink",
      url: "",
      postId: "",
      target: "_self",
      cssClasses: "",
    });
  };

  const handleCreateMenu = () => {
    if (!menuForm.name || !menuForm.slug) {
      toast({
        title: "입력 오류",
        description: "이름과 슬러그는 필수입니다",
        variant: "destructive",
      });
      return;
    }
    createMenuMutation.mutate(menuForm);
  };

  const handleCreateItem = () => {
    if (!itemForm.title) {
      toast({
        title: "입력 오류",
        description: "제목은 필수입니다",
        variant: "destructive",
      });
      return;
    }

    if (itemForm.type === "hyperlink" && !itemForm.url) {
      toast({
        title: "입력 오류",
        description: "하이퍼링크 타입은 URL이 필요합니다",
        variant: "destructive",
      });
      return;
    }

    if (itemForm.type === "post" && !itemForm.postId) {
      toast({
        title: "입력 오류",
        description: "포스트 타입은 포스트 선택이 필요합니다",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      title: itemForm.title,
      type: itemForm.type,
      target: itemForm.target,
      cssClasses: itemForm.cssClasses || undefined,
    };

    if (itemForm.type === "hyperlink") {
      data.url = itemForm.url;
    } else {
      data.postId = parseInt(itemForm.postId);
    }

    if (editingItem) {
      updateItemMutation.mutate({ itemId: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      type: item.type,
      url: item.url || "",
      postId: item.postId?.toString() || "",
      target: item.target,
      cssClasses: item.cssClasses || "",
    });
    setIsCreateItemOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">메뉴 관리</h2>
        <Dialog open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 메뉴 만들기
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 메뉴 만들기</DialogTitle>
              <DialogDescription>블로그에서 사용할 메뉴를 생성합니다</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="menu-name">메뉴 이름</Label>
                <Input
                  id="menu-name"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="예: Main Menu"
                />
              </div>
              <div>
                <Label htmlFor="menu-slug">슬러그</Label>
                <Input
                  id="menu-slug"
                  value={menuForm.slug}
                  onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                  placeholder="예: main-menu"
                />
              </div>
              <div>
                <Label htmlFor="menu-description">설명 (선택)</Label>
                <Input
                  id="menu-description"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="메뉴 설명"
                />
              </div>
              <Button onClick={handleCreateMenu} className="w-full">
                생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menus List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>메뉴 목록</CardTitle>
            <CardDescription>관리할 메뉴를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {menus.map((menu: Menu) => (
              <div
                key={menu.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedMenu === menu.id
                    ? "bg-accent border-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => setSelectedMenu(menu.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{menu.name}</h3>
                    <p className="text-sm text-muted-foreground">{menu.slug}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${menu.name}" 메뉴를 삭제하시겠습니까?`)) {
                        deleteMenuMutation.mutate(menu.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>메뉴 항목</CardTitle>
                <CardDescription>
                  {selectedMenu
                    ? "메뉴 항목을 추가하고 관리하세요"
                    : "왼쪽에서 메뉴를 선택하세요"}
                </CardDescription>
              </div>
              {selectedMenu && (
                <Dialog open={isCreateItemOpen} onOpenChange={(open) => {
                  setIsCreateItemOpen(open);
                  if (!open) {
                    setEditingItem(null);
                    resetItemForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      항목 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingItem ? "메뉴 항목 수정" : "메뉴 항목 추가"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-title">제목</Label>
                        <Input
                          id="item-title"
                          value={itemForm.title}
                          onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                          placeholder="메뉴 항목 제목"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-type">타입</Label>
                        <Select
                          value={itemForm.type}
                          onValueChange={(value: "hyperlink" | "post") =>
                            setItemForm({ ...itemForm, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hyperlink">하이퍼링크</SelectItem>
                            <SelectItem value="post">포스트</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {itemForm.type === "hyperlink" ? (
                        <div>
                          <Label htmlFor="item-url">URL</Label>
                          <Input
                            id="item-url"
                            value={itemForm.url}
                            onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                            placeholder="https://example.com"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="item-post">포스트 선택</Label>
                          <Select
                            value={itemForm.postId}
                            onValueChange={(value) => setItemForm({ ...itemForm, postId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="포스트를 선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {posts.map((post: any) => (
                                <SelectItem key={post.id} value={post.id.toString()}>
                                  {post.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="item-target">타겟</Label>
                        <Select
                          value={itemForm.target}
                          onValueChange={(value) => setItemForm({ ...itemForm, target: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_self">같은 창</SelectItem>
                            <SelectItem value="_blank">새 창</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-css">CSS 클래스 (선택)</Label>
                        <Input
                          id="item-css"
                          value={itemForm.cssClasses}
                          onChange={(e) => setItemForm({ ...itemForm, cssClasses: e.target.value })}
                          placeholder="custom-class"
                        />
                      </div>
                      <Button onClick={handleCreateItem} className="w-full">
                        {editingItem ? "수정" : "추가"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedMenu ? (
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    메뉴 항목이 없습니다. 항목을 추가해보세요.
                  </p>
                ) : (
                  items.map((item: MenuItem) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.type === "hyperlink" ? (
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className="font-semibold">{item.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.type === "hyperlink" ? item.url : `Post ID: ${item.postId}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {item.target} | Order: {item.sortOrder}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                왼쪽에서 메뉴를 선택하세요
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMenus;

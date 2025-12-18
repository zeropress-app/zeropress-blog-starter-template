import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo, Code, ImageIcon, Loader2, Link2, FileUp } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const [htmlContent, setHtmlContent] = useState(content);
  const [currentTab, setCurrentTab] = useState<string>("visual");
  const [isUploading, setIsUploading] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  // Update editor content when prop changes (only for initial load or external changes)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && content !== htmlContent) {
      editor.commands.setContent(content);
      setHtmlContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleHtmlChange = (newHtml: string) => {
    setHtmlContent(newHtml);
    onChange(newHtml);
  };

  const handleTabChange = (value: string) => {
    // When switching to visual mode, sync HTML content to editor
    if (value === "visual" && currentTab === "html") {
      editor.commands.setContent(htmlContent);
    }
    setCurrentTab(value);
  };

  const handleImageUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "잘못된 파일 형식",
        description: "PNG, JPEG, GIF, WebP 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 5MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await api.uploadFile(file, 'image');
      
      // Insert image into editor
      if (editor && result.data?.url) {
        editor.chain().focus().setImage({ src: result.data.url }).run();
        toast({
          title: "이미지 업로드 완료",
          description: "이미지가 성공적으로 업로드되었습니다.",
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "이미지 업로드 실패",
        description: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size (max 10MB for general files)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "파일 크기는 10MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await api.uploadFile(file, 'document');
      
      // Insert link to file in editor
      if (editor && result.data?.url) {
        const fileName = file.name;
        editor.chain().focus().insertContent(`<a href="${result.data.url}" target="_blank" rel="noopener noreferrer">${fileName}</a>`).run();
        toast({
          title: "파일 업로드 완료",
          description: "파일이 성공적으로 업로드되었습니다.",
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "파일 업로드 실패",
        description: error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleLinkInsert = () => {
    if (!linkUrl) {
      toast({
        title: "URL을 입력하세요",
        variant: "destructive",
      });
      return;
    }

    if (editor) {
      if (linkText) {
        // Insert new link with text
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`).run();
      } else {
        // Set link on selected text
        editor.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
      }
      
      setIsLinkDialogOpen(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="visual">Visual</TabsTrigger>
        <TabsTrigger value="html">HTML</TabsTrigger>
      </TabsList>

      <TabsContent value="visual" className="mt-0">
        <div className="border border-input rounded-md bg-background">
          <div className="border-b border-input p-2 flex flex-wrap gap-1">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleImageInputChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-accent' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="border-l border-input mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageButtonClick}
          disabled={isUploading}
          title="이미지 업로드"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleFileButtonClick}
          disabled={isUploading}
          title="파일 업로드"
        >
          <FileUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsLinkDialogOpen(true)}
          title="링크 삽입"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <div className="border-l border-input mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
          </div>
          <EditorContent editor={editor} />
        </div>
      </TabsContent>

      <TabsContent value="html" className="mt-0">
        <Textarea
          value={htmlContent}
          onChange={(e) => handleHtmlChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
          placeholder="HTML 코드를 입력하세요..."
        />
      </TabsContent>

      {/* Link Insert Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>링크 삽입</DialogTitle>
            <DialogDescription>
              링크 URL과 텍스트를 입력하세요. 텍스트를 선택한 경우 URL만 입력하면 됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="link-text">링크 텍스트 (선택사항)</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="링크 텍스트"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleLinkInsert}>
              삽입
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};
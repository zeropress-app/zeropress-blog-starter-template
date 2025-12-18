import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const MarkdownEditor = ({ content, onChange, placeholder }: MarkdownEditorProps) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "write" | "preview")} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="write">작성</TabsTrigger>
        <TabsTrigger value="preview">미리보기</TabsTrigger>
      </TabsList>
      
      <TabsContent value="write" className="mt-4">
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "마크다운 형식으로 작성하세요..."}
          className="min-h-[500px] font-mono"
        />
        <div className="mt-2 text-sm text-muted-foreground">
          <p>마크다운 문법을 사용할 수 있습니다:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li># 제목, ## 부제목</li>
            <li>**굵게**, *기울임*</li>
            <li>[링크](URL), ![이미지](URL)</li>
            <li>- 목록, 1. 번호 목록</li>
            <li>`코드`, ```언어 코드블록 ```</li>
          </ul>
        </div>
      </TabsContent>
      
      <TabsContent value="preview" className="mt-4">
        <div className="min-h-[500px] p-4 border rounded-md prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || "*미리보기할 내용이 없습니다*"}
          </ReactMarkdown>
        </div>
      </TabsContent>
    </Tabs>
  );
};

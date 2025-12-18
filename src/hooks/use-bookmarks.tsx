import { useState, useEffect } from "react";

const BOOKMARKS_KEY = "blog-bookmarks";

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    const saved = localStorage.getItem(BOOKMARKS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (postId: number) => {
    setBookmarks((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const isBookmarked = (postId: number) => bookmarks.includes(postId);

  return { bookmarks, toggleBookmark, isBookmarked };
};

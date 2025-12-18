import { useTheme } from '@/contexts/ThemeContext';

export const ThemedHome = () => {
  const { currentTheme } = useTheme();
  const HomeComponent = currentTheme.templates.Home;
  return <HomeComponent />;
};

export const ThemedPostDetail = () => {
  const { currentTheme } = useTheme();
  const PostDetailComponent = currentTheme.templates.PostDetail;
  return <PostDetailComponent />;
};

export const ThemedNotFound = () => {
  const { currentTheme } = useTheme();
  const NotFoundComponent = currentTheme.templates.NotFound;
  return <NotFoundComponent />;
};

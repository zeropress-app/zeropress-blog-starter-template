import { ThemeConfig } from '@/types/theme';
import Home from './templates/Home';
import PostDetail from './templates/PostDetail';
import NotFound from './templates/NotFound';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PostCard } from './components/PostCard';

export const defaultTheme: ThemeConfig = {
  id: 'default',
  name: 'Default Theme',
  version: '1.0.0',
  author: 'Lael',
  description: 'Modern and clean default theme with gradient accents',
  screenshot: '/themes/default/screenshot.svg',
  templates: {
    Home,
    PostDetail,
    NotFound,
  },
  components: {
    Navbar,
    Footer,
    PostCard,
  },
  styles: {
    colors: {
      primary: 'hsl(var(--primary))',
      accent: 'hsl(var(--accent))',
      background: 'hsl(var(--background))',
    },
  },
};

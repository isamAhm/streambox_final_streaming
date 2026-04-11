export interface MovieInterface {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  backdropUrl?: string | null;
  videoUrl: string;
  duration: string;
  genre: string;
  year: string;
  rating?: number;
}

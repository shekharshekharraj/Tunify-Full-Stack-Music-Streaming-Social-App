export type NewRelease = {
  _id: string;
  title: string;
  summary: string;
  tags: string[];
  icon: string;
  link: string;
  imageUrl?: string;
  imageAlt?: string;
  pinned?: boolean;
  publishedAt: string;
  updatedAt: string;
  author?: string;
};

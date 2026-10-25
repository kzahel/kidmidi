// Public assets must follow the Vite base path (GitHub project Pages use /kidmidi/).
export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

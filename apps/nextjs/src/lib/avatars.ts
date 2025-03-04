export const getAvatarUrl = (str = "Anonymous") => {
  const hash = hashString(str);
  return `/avatars/${hash % 20}.svg`;
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

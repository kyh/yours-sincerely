export const POST_EXPIRY_DAYS_AGO = 21;

export const isPostContentValid = (content?: string): content is string => {
  return !!content && content.length > 10;
};

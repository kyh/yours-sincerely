/** The letter key must stay "post-form": unsent letters already sit in
    browsers' localStorage under it. */
export const postDraftKey = (parentId?: string) =>
  parentId === undefined ? "post-form" : `post-form:comment:${parentId}`;

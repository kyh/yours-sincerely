import { firestore, useQuery, prepareDocForCreate } from "util/db";

export const useUserBlocks = (uid) => {
  const blockedUsersQuery = useQuery(
    uid && firestore.collection("userBlocks").where("createdBy", "==", uid)
  );

  const dataMap = blockedUsersQuery.data
    ? blockedUsersQuery.data.reduce((map, b) => {
        map[b.blockedUser] = b.id;
        return map;
      }, {})
    : {};

  return { status: blockedUsersQuery.status, dataMap };
};

export const blockUser = (userId) => {
  const block = prepareDocForCreate({ blockedUser: userId });
  return firestore.collection("userBlocks").add(block);
};

export const unblockUser = (blockId) => {
  return firestore.collection("userBlocks").doc(blockId).delete();
};

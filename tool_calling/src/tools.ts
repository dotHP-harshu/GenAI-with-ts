export const getDateTime = () => {
  return new Date().toISOString();
};

export const getUser = ({ userId }: { userId: string }) => {
  return {
    id: userId,
    name: "Harsh Prjapati",
    email: "harshPrajapati@zoomail.com",
  };
};

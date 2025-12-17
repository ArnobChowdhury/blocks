interface User {
  id: string;
  email: string;
}

let session: {
  accessToken: string | null;
  user: User | null;
} = { accessToken: null, user: null };

const setSession = (accessToken: string | null, user: User | null) => {
  session.accessToken = accessToken;
  session.user = user;
};

const getSession = () => session;

export { setSession, getSession };

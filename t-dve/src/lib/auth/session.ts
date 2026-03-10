import useNavigationHistory from "../../hooks/useNavigationHistory";


const navigate = (path: string, replace?: boolean):void => {
  const { pushLatest } = useNavigationHistory();
  if (replace) {
    window.location.replace(path)
  } else {
    pushLatest(path)
  }
}


const signOut = async () => {
    localStorage.clear()
    navigate("/login", true)
}

const refreshToken = async () => {
  try {
      const refresh_token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (!refresh_token) return

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token }),
      });

      if (!response.ok) throw new Error("Refresh token invalid");

      const result = await response.json();
      if (result?.status === true) {
          localStorage.setItem('token', result?.data?.access_token);
          return result?.data?.access_token;
      } else {
          throw new Error("Failed to refresh token");
      }
  } catch (error) {
      console.error("Token refresh failed:", error);
      localStorage.clear();
      window.location.replace('/login');
      throw error;
  }
};



/**
 * Asynchronous function to set up Firebase authentication and manage user login state.
 *
 * @param authCallBack - Callback function to handle authentication state changes.
 * @returns {Promise<void>} - A Promise that resolves when the authentication setup is complete.
 */
const authSetter = async (authCallBack: any): Promise<void> => {

  authCallBack({ status: "loading" });
  
};


export { authSetter , signOut, refreshToken}
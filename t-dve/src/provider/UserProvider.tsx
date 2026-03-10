/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, createContext, useEffect, useReducer, useCallback } from "react"; 
import type { IUserContext, UserAuth } from "./types/userProvider"; 
import constants from "../lib/constants";
import mapper from "../lib/mapper";
import { userReducer } from "./reduser";
import { defaultUser } from "./defaultUser";
import util from "../utils";
import { authSetter } from "../lib/auth/session";
import useApiCall from "../hooks/useApi";
import axiosInstance from "../api/axiosinstance";
import { Permission } from "../utils/permissions";

export const UserContext = createContext<IUserContext>({
  user: defaultUser,
  authLoading: false,
  page: '',
  userDirection: '',
  methods: {
    dispatchUser: () => { },
    setUserData: () => { },
    checkPermission: () => false,
  },
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, dispatchUser] = useReducer(userReducer, defaultUser);
  const [getUserData, { loading }] = useApiCall(axiosInstance.get);

  const token = localStorage.getItem('token');
  const phone = localStorage.getItem('phone');
  const email = localStorage.getItem('email');

  const userNumber = token ? util.decodeToken(token) : null;
  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
  const skipUserFetch = !token;

  const setUserData = (userData: UserAuth) => {
    dispatchUser({ type: constants.SET_USER_MOBILE_NUMBER, payload: userNumber });
    
    const mapped = mapper.getUser(userData);
    mapped.owner_id = userData.owner_id ?? null;

    dispatchUser({ type: constants.SET_USER, payload: mapped });
    if (userData?.landing_page) {
      dispatchUser({ type: constants.SET_USER_LANDING_PAGE, payload: userData.landing_page });
    }

    if (userData?.language) {
      localStorage.setItem('userLanguage', userData.language);
      // i18n.changeLanguage(userData.language);
    }
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // --- NEW: checkPermission helper function ---
  const checkPermission = useCallback((permission: Permission): boolean => {
    const userPermissions = user.access || [];
    const userRole = user.role;

    // 1. Blanket access for Super Admin and Admin roles
    if (userRole === 'Super Admin' || userRole === 'Admin') {
      return true;
    }

    // 2. Handle granular permissions from user.access
    // "Edit" implies "View"
    if (permission.endsWith(' View')) {
      const editPerm = permission.replace(' View', ' Edit') as Permission;
      if (userPermissions.includes(editPerm)) {
        return true;
      }
    }

    return userPermissions.includes(permission);
  }, [user.access, user.role]); // Depend on user.access and user.role

  const getUser = async () => {
    await getUserData(
      [constants.GET_USER_INITIAL_DATA, { params: { phone, email } }],
      {
        onCompleted: async (userData) => {
          if (userData) {
            setUserData(userData?.data?.data);
            console.log("userData", JSON.stringify(userData?.data?.data));
            await util.requestAndLoginOnesignalPermission(userData?.data?.data?.id);
          }
        },
        onError: (error) => {
          console.error("User fetch failed:", error);
        }
      }
    );
  };

  useEffect(() => {
    authSetter((authState: any) => {
      dispatchUser({ type: constants.SET_AUTHSTATE, payload: authState });
    });

    (async () => {
      if (!skipUserFetch) {
        await getUser();
      } else if (userFromStorage?.page) {
        // Optional: preload user from localStorage
        // setUserData(userFromStorage);
      }
    })();
  }, []);

  const value: IUserContext = {
    user,
    authLoading: loading,
    page: user.page || '',
    userDirection: user?.userDirection || '',
    methods: {
      dispatchUser,
      setUserData,
      checkPermission, 
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
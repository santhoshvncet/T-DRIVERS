import { Permission } from "../../utils/permissions";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IDefaultState {
  id: any;
  userId: number;
  language: string;
  page: string | null;
  email: string;
  phone: string;
  name: string;
  userDirection: string;
  is_driver: boolean;
  owner_id: number | null;
  data:number | null;
  driver_id: number | null;
  role: string;
  access: Permission[];
  driver_status: string
}

export interface IUserContext {
  user: IDefaultState;
  page: string;
  methods: {
    dispatchUser: React.Dispatch<any>;
    setUserData: (userData: UserAuth) => void;
    checkPermission: (permission: Permission) => boolean;
  };
  authLoading: boolean;
  userDirection: string
}

export interface UserAuth {
  name: string;
  landing_page: string;
  status: string;
  id: number;
  language: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_driver?: boolean;
  owner_id?: number;
  driver_id?: number;
  role: string;
  access: Permission[];
  driver_status: string
}

export interface UserMapped {
  landing_page: string;
  userId: number;
  language: string;
  page: string;
  email: string;
  phone: string;
  name: string;
  userDirection: string;
  is_driver: boolean;
  owner_id: number | null;
  driver_id: number | null;
  role: string;
  access: Permission[];
  driver_status: string
}

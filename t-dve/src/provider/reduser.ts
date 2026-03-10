import type { IDefaultState } from "./types/userProvider";
import constants from "../lib/constants";

export const userReducer = (state: IDefaultState, action: any): IDefaultState => {
  switch (action.type) {
    case constants.SET_USER:
      return { ...state, ...action.payload };

    case constants.SET_USER_MOBILE_NUMBER:
      return { ...state, phone: action.payload };

    case constants.SET_USER_LANDING_PAGE:
      return { ...state, page: action.payload };

    case constants.SET_AUTHSTATE:
      return { ...state, ...action.payload };

      case constants.SET_PAGE:
  return {
    ...state,
    page: action.payload
  };


    default:
      return state;
  }
};
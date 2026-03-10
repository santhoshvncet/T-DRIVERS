// src/hooks/useLandingPage.ts
import { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import useApiCall from './useApi';
import axiosInstance from '../api/axiosinstance';
import useNavigationHistory from './useNavigationHistory';
import { UserContext } from '../provider/UserProvider';
import constants from '../lib/constants';

export const useLandingPage = () => {
  const [update_landing_page] = useApiCall(axiosInstance.post);
  const { pushLatest } = useNavigationHistory();
  const history = useHistory();
  const { user } = useContext(UserContext);

  const updateUserLandingPage = async (is_driver: boolean, landing_page: string) => {
    try {
      await update_landing_page(
        [ constants.UPDATE_LANDING_PAGE, {
            landing_page: landing_page,
            user_id: user.userId,   // updated key
            is_driver: is_driver     // added field
          },
        ],
        {
          onCompleted: () => {
            pushLatest('/');
            sessionStorage.setItem("skipFallback", "true");
            window.location.reload();
          },
          onError: (error) => {
            console.error('Landing page update failed:', error);
          },
        }
      );
    } catch (err) {
      console.error('Landing page update error:', err);
    }
  };

  return { updateUserLandingPage };
};
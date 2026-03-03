import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@wildfire_onboarded_v1';

export function useFirstLaunch(): [boolean, () => void] {
  const [isFirst, setIsFirst] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(val => {
      if (val === null) setIsFirst(true);
    });
  }, []);

  const markSeen = () => {
    setIsFirst(false);
    AsyncStorage.setItem(KEY, '1');
  };

  return [isFirst, markSeen];
}

const TOUR_KEY_PREFIX = '@wildfire_app_tour_seen_';

export function useShouldShowAppTour(userId: string | undefined, isDemo: boolean): [boolean, () => void] {
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  useEffect(() => {
    if (isDemo) {
      setShouldShow(true);
      return;
    }

    if (!userId) return;

    const key = TOUR_KEY_PREFIX + userId;
    AsyncStorage.getItem(key).then(val => {
      if (val === null) {
        setShouldShow(true);
      }
    });
  }, [userId, isDemo]);

  const markTourSeen = () => {
    setShouldShow(false);
    if (userId && !isDemo) {
      AsyncStorage.setItem(TOUR_KEY_PREFIX + userId, '1');
    }
  };

  return [shouldShow, markTourSeen];
}

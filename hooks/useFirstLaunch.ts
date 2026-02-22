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

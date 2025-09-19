import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

const translations = {
  en: {
    dashboard: 'Bharat Pashudhan Dashboard',
    totalScans: 'Total Scans',
    cattle: 'Cattle',
    buffaloes: 'Buffaloes',
    accuracy: 'Accuracy',
    quickActions: 'Quick Actions',
    newScan: 'New Scan',
    addAnimal: 'Add Animal',
    reports: 'Reports',
    recentScans: 'Recent Scans',
    seeAll: 'See All',
    noScans: 'No scans yet',
    startScan: 'Start by capturing a new scan',
    startNewScan: 'Start New Scan',
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    accountSettings: 'Account Settings',
    help: 'Help',
    logout: 'Logout',
    english: 'English',
    hindi: 'Hindi',
    punjabi: 'Punjabi',
    light: 'Light',
    dark: 'Dark',
    on: 'On',
    off: 'Off',
  },
  hi: {
    dashboard: 'भारत पशुधन डैशबोर्ड',
    totalScans: 'कुल स्कैन',
    cattle: 'गाय',
    buffaloes: 'भैंस',
    accuracy: 'सटीकता',
    quickActions: 'त्वरित कार्य',
    newScan: 'नया स्कैन',
    addAnimal: 'पशु जोड़ें',
    reports: 'रिपोर्ट',
    recentScans: 'हाल के स्कैन',
    seeAll: 'सभी देखें',
    noScans: 'अभी तक कोई स्कैन नहीं',
    startScan: 'नया स्कैन कैप्चर करके शुरू करें',
    startNewScan: 'नया स्कैन शुरू करें',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    theme: 'थीम',
    notifications: 'सूचनाएं',
    accountSettings: 'खाता सेटिंग्स',
    help: 'मदद',
    logout: 'लॉग आउट',
    english: 'अंग्रेजी',
    hindi: 'हिंदी',
    punjabi: 'पंजाबी',
    light: 'लाइट',
    dark: 'डार्क',
    on: 'चालू',
    off: 'बंद',
  },
  pa: {
    dashboard: 'ਭਾਰਤ ਪਸ਼ੂਧਨ ਡੈਸ਼ਬੋਰਡ',
    totalScans: 'ਕੁਲ ਸਕੈਨ',
    cattle: 'ਗਾਏ',
    buffaloes: 'ਭੈਂਸ',
    accuracy: 'ਸਹੀਤਾ',
    quickActions: 'ਤੇਜ਼ ਕਾਰਵਾਈਆਂ',
    newScan: 'ਨਵਾਂ ਸਕੈਨ',
    addAnimal: 'ਜਾਨਵਰ ਸ਼ਾਮਲ ਕਰੋ',
    reports: 'ਰਿਪੋਰਟ',
    recentScans: 'ਹਾਲ ਹੀ ਦੇ ਸਕੈਨ',
    seeAll: 'ਸਭ ਵੇਖੋ',
    noScans: 'ਅਜੇ ਤੱਕ ਕੋਈ ਸਕੈਨ ਨਹੀਂ',
    startScan: 'ਨਵਾਂ ਸਕੈਨ ਕੈਪਚਰ ਕਰਕੇ ਸ਼ੁਰੂ ਕਰੋ',
    startNewScan: 'ਨਵਾਂ ਸਕੈਨ ਸ਼ੁਰੂ ਕਰੋ',
    settings: 'ਸੈਟਿੰਗਜ਼',
    language: 'ਭਾਸ਼ਾ',
    theme: 'ਥੀਮ',
    notifications: 'ਨੋਟੀਫਿਕੇਸ਼ਨ',
    accountSettings: 'ਅਕਾਉਂਟ ਸੈਟਿੰਗਜ਼',
    help: 'ਮਦਦ',
    logout: 'ਲੌਗ ਆਉਟ',
    english: 'ਅੰਗਰੇਜ਼ੀ',
    hindi: 'ਹਿੰਦੀ',
    punjabi: 'ਪੰਜਾਬੀ',
    light: 'ਲਾਈਟ',
    dark: 'ਡਾਰਕ',
    on: 'ਚਾਲੂ',
    off: 'ਬੰਦ',
  },
};

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => listener.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, language, changeLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

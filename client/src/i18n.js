import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    dashboard: "Mission Control",
                    audience: "Audience Display",
                    stage: "Stage Hub",
                    stream: "Stream Overlay",
                    reset: "System Reset",
                    upload: "Upload Content",
                    go_live: "Go Live",
                }
            },
            yo: {
                translation: {
                    dashboard: "Àkóso Ìránṣẹ́",
                    audience: "Ìfihàn Àwọn Ènìyàn",
                    stage: "Ibi Ìdúró Àwọn Òṣèlú",
                    upload: "Gbé Àkóónú",
                    go_live: "Bẹ̀rẹ̀",
                }
            }
        }
    });

export default i18n;

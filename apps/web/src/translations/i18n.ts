import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import commonPt from "./pt-BR/common.json";
import commonEn from "./en-US/common.json";
import commonEs from "./es-ES/common.json";

// eslint-disable-next-line import/no-named-as-default-member -- i18next exposes `use` as both a default-member method and a named export; the chained call is the documented setup pattern
i18next
  .use(initReactI18next)
  .init({
    resources: {
      "pt-BR": { common: commonPt },
      "en-US": { common: commonEn },
      "es-ES": { common: commonEs },
    },
    lng: "pt-BR",
    fallbackLng: "pt-BR",
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
  })
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console -- i18next setup runs before any toast/UI is mounted, so console is the only available sink for setup failures
    console.error("Failed to initialize i18next", error);
  });

export default i18next;

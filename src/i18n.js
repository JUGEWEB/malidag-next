import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import af from "./locales/af/translation.json";
import am from "./locales/am/translation.json";
import ar from "./locales/ar/translation.json";
import az from "./locales/az/translation.json";
import be from "./locales/be/translation.json";
import bg from "./locales/bg/translation.json";
import bn from "./locales/bn/translation.json";
import bs from "./locales/bs/translation.json";
import ca from "./locales/ca/translation.json";
import ceb from "./locales/ceb/translation.json";
import co from "./locales/co/translation.json";
import cs from "./locales/cs/translation.json";
import cy from "./locales/cy/translation.json";
import da from "./locales/da/translation.json";
import de from "./locales/de/translation.json";
import el from "./locales/el/translation.json";
import en from "./locales/en/translation.json";
import eo from "./locales/eo/translation.json";
import es from "./locales/es/translation.json";
import et from "./locales/et/translation.json";
import eu from "./locales/eu/translation.json";
import fa from "./locales/fa/translation.json";
import fi from "./locales/fi/translation.json";
import fr from "./locales/fr/translation.json";
import fy from "./locales/fy/translation.json";
import ga from "./locales/ga/translation.json";
import gd from "./locales/gd/translation.json";
import gl from "./locales/gl/translation.json";
import gu from "./locales/gu/translation.json";
import ha from "./locales/ha/translation.json";
import haw from "./locales/haw/translation.json";
import he from "./locales/he/translation.json";
import hi from "./locales/hi/translation.json";
import hmn from "./locales/hmn/translation.json";
import hr from "./locales/hr/translation.json";
import ht from "./locales/ht/translation.json";
import hu from "./locales/hu/translation.json";
import hy from "./locales/hy/translation.json";
import id from "./locales/id/translation.json";
import ig from "./locales/ig/translation.json";
import is from "./locales/is/translation.json";
import it from "./locales/it/translation.json";
import ja from "./locales/ja/translation.json";
import jw from "./locales/jw/translation.json";
import ka from "./locales/ka/translation.json";
import kk from "./locales/kk/translation.json";
import km from "./locales/km/translation.json";
import kn from "./locales/kn/translation.json";
import ko from "./locales/ko/translation.json";
import ku from "./locales/ku/translation.json";
import ky from "./locales/ky/translation.json";
import la from "./locales/la/translation.json";
import lb from "./locales/lb/translation.json";
import lo from "./locales/lo/translation.json";
import lt from "./locales/lt/translation.json";
import lv from "./locales/lv/translation.json";
import mg from "./locales/mg/translation.json";
import mi from "./locales/mi/translation.json";
import mk from "./locales/mk/translation.json";
import ml from "./locales/ml/translation.json";
import mn from "./locales/mn/translation.json";
import mr from "./locales/mr/translation.json";
import ms from "./locales/ms/translation.json";
import mt from "./locales/mt/translation.json";
import my from "./locales/my/translation.json";
import ne from "./locales/ne/translation.json";
import nl from "./locales/nl/translation.json";
import no from "./locales/no/translation.json";
import ny from "./locales/ny/translation.json";
import pa from "./locales/pa/translation.json";
import pl from "./locales/pl/translation.json";
import ps from "./locales/ps/translation.json";
import pt from "./locales/pt/translation.json";
import ro from "./locales/ro/translation.json";
import ru from "./locales/ru/translation.json";
import rw from "./locales/rw/translation.json";
import sd from "./locales/sd/translation.json";
import si from "./locales/si/translation.json";
import sk from "./locales/sk/translation.json";
import sl from "./locales/sl/translation.json";
import sm from "./locales/sm/translation.json";
import sn from "./locales/sn/translation.json";
import so from "./locales/so/translation.json";
import sq from "./locales/sq/translation.json";
import sr from "./locales/sr/translation.json";
import st from "./locales/st/translation.json";
import su from "./locales/su/translation.json";
import sv from "./locales/sv/translation.json";
import sw from "./locales/sw/translation.json";
import ta from "./locales/ta/translation.json";
import te from "./locales/te/translation.json";
import tg from "./locales/tg/translation.json";
import th from "./locales/th/translation.json";
import tk from "./locales/tk/translation.json";
import tl from "./locales/tl/translation.json";
import tr from "./locales/tr/translation.json";
import tt from "./locales/tt/translation.json";
import ug from "./locales/ug/translation.json";
import uk from "./locales/uk/translation.json";
import ur from "./locales/ur/translation.json";
import uz from "./locales/uz/translation.json";
import vi from "./locales/vi/translation.json";
import xh from "./locales/xh/translation.json";
import yi from "./locales/yi/translation.json";
import yo from "./locales/yo/translation.json";
import zh from "./locales/zh/translation.json";
import zu from "./locales/zu/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
     af: { translation: af },
      am: { translation: am },
      ar: { translation: ar },
      az: { translation: az },
      be: { translation: be },
      bg: { translation: bg },
      bn: { translation: bn },
      bs: { translation: bs },
      ca: { translation: ca },
      ceb: { translation: ceb },
      co: { translation: co },
      cs: { translation: cs },
      cy: { translation: cy },
      da: { translation: da },
      de: { translation: de },
      el: { translation: el },
      en: { translation: en },
      eo: { translation: eo },
      es: { translation: es },
      et: { translation: et },
      eu: { translation: eu },
      fa: { translation: fa },
      fi: { translation: fi },
      fr: { translation: fr },
      fy: { translation: fy },
      ga: { translation: ga },
       gd: { translation: gd },
      gl: { translation: gl },
      gu: { translation: gu },
      ha: { translation: ha },
      haw: { translation: haw },
      he: { translation: he },
      hi: { translation: hi },
      hmn: { translation: hmn },
      hr: { translation: hr },
      ht: { translation: ht },
      hu: { translation: hu },
      hy: { translation: hy },
      id: { translation: id },
      ig: { translation: ig },
      is: { translation: is },
      it: { translation: it },
      ja: { translation: ja },
      jw: { translation: jw },
      ka: { translation: ka },
      kk: { translation: kk },
      km: { translation: km },
      kn: { translation: kn },
      ko: { translation: ko },
      ku: { translation: ku },
      ky: { translation: ky },
      la: { translation: la },
      lb: { translation: lb },
      lo: { translation: lo },
      lt: { translation: lt },
      lv: { translation: lv },
      mg: { translation: mg },
      mi: { translation: mi },
      mk: { translation: mk },
      ml: { translation: ml },
      mn: { translation: mn },
      mr: { translation: mr },
      ms: { translation: ms },
      mt: { translation: mt },
      my: { translation: my },
       ne: { translation: ne },
      nl: { translation: nl },
      no: { translation: no },
      ny: { translation: ny },
      pa: { translation: pa },
      pl: { translation: pl },
      ps: { translation: ps },
      pt: { translation: pt },
      ro: { translation: ro },
      ru: { translation: ru },
      rw: { translation: rw },
      sd: { translation: sd },
      si: { translation: si },
       sk: { translation: sk },
      sl: { translation: sl },
      sm: { translation: sm },
      sn: { translation: sn },
      so: { translation: so },
      sq: { translation: sq },
      sr: { translation: sr },
      st: { translation: st },
      su: { translation: su },
      sv: { translation: sv },
      sw: { translation: sw },
      ta: { translation: ta },
      te: { translation: te },
       tg: { translation: tg },
      th: { translation: th },
      tk: { translation: tk },
      tl: { translation: tl },
      tr: { translation: tr },
      tt: { translation: tt },
      ug: { translation: ug },
      uk: { translation: uk },
      ur: { translation: ur },
      uz: { translation: uz },
      vi: { translation: vi },
      xh: { translation: xh },
      yi: { translation: yi },
       yo: { translation: yo },
      zh: { translation: zh },
      zu: { translation: zu }
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;

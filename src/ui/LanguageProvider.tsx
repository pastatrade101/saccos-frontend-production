import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren
} from "react";

/**
 * English / Swahili selection for the member-facing surface.
 *
 * Persisted under the same key the design prototype uses, so the choice carries
 * from the sign-in screen into the portal. Numbers, references and account
 * identifiers are never translated — only prose.
 */
export type MemberLanguage = "EN" | "SW";

interface LanguageContextValue {
    lang: MemberLanguage;
    setLang: (lang: MemberLanguage) => void;
    /** Picks the string for the active language. */
    t: (en: string, sw: string) => string;
}

const LANG_KEY = "ilboru-lang";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): MemberLanguage {
    try {
        return localStorage.getItem(LANG_KEY) === "SW" ? "SW" : "EN";
    } catch {
        return "EN";
    }
}

export function LanguageProvider({ children }: PropsWithChildren) {
    const [lang, setLangState] = useState<MemberLanguage>(getInitialLanguage);

    useEffect(() => {
        try {
            localStorage.setItem(LANG_KEY, lang);
        } catch {
            // Private mode or quota errors: the choice just won't survive a reload.
        }
    }, [lang]);

    const setLang = useCallback((next: MemberLanguage) => {
        setLangState(next);
    }, []);

    const t = useCallback((en: string, sw: string) => (lang === "SW" ? sw : en), [lang]);

    const value = useMemo<LanguageContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error("useLanguage must be used within LanguageProvider");
    }

    return context;
}

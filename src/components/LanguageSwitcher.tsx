import { useI18n, type Lang } from '@/lib/i18n';

export const LanguageSwitcher = () => {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {(['en', 'ru'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-md text-xs font-semibold uppercase transition-colors ${
            lang === l
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

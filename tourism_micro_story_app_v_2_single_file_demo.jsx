import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  Map, Camera, QrCode, Star, Wallet as WalletIcon, User, Play,
  CheckCircle2, Ticket, Home as HomeIcon, List, Search, Filter, ChevronRight, ChevronLeft,
  Pause, PlayCircle, Headphones, Languages, Lock, Mail, Phone, Eye, EyeOff,
  LogOut, Shield, Link as LinkIcon, Sun, Moon, RefreshCcw, X as Close
} from "lucide-react";

// ---------------------------------------------
// 0) i18n INIT (single-file, keeps JS language)
// ---------------------------------------------
const resources = {
  en: { common: { login: { title: "Welcome", email: "Email", password: "Password", signIn: "Sign in", language: "Language", theme: "Theme" }, settings: { title: "Profile & Settings", language: "Language", theme: "Theme", dark: "Dark", light: "Light", system: "System" }, wallet: { title: "Wallet", coupons: "Coupons", saved: "Saved", expired: "Expired", daysLeft: "{{count}} days left" }, coupon: { save: "Save to Wallet", redeem: "Redeem", expiresIn: "Expires in {{time}}", expired: "Expired" }, toast: { saved: "Saved to Wallet", alreadySaved: "Already in Wallet" } } },
  de: { common: { login: { title: "Willkommen", email: "E-Mail", password: "Passwort", signIn: "Anmelden", language: "Sprache", theme: "Design" }, settings: { title: "Profil & Einstellungen", language: "Sprache", theme: "Design", dark: "Dunkel", light: "Hell", system: "System" }, wallet: { title: "Wallet", coupons: "Gutscheine", saved: "Gespeichert", expired: "Abgelaufen", daysLeft: "Noch {{count}} Tage" }, coupon: { save: "In Wallet speichern", redeem: "Einlösen", expiresIn: "Läuft ab in {{time}}", expired: "Abgelaufen" }, toast: { saved: "In der Wallet gespeichert", alreadySaved: "Bereits in der Wallet" } } },
  fr: { common: { login: { title: "Bienvenue", email: "E-mail", password: "Mot de passe", signIn: "Se connecter", language: "Langue", theme: "Thème" }, settings: { title: "Profil & Paramètres", language: "Langue", theme: "Thème", dark: "Sombre", light: "Clair", system: "Système" }, wallet: { title: "Portefeuille", coupons: "Coupons", saved: "Enregistré", expired: "Expiré", daysLeft: "Plus que {{count}} jours" }, coupon: { save: "Enregistrer dans le portefeuille", redeem: "Utiliser", expiresIn: "Expire dans {{time}}", expired: "Expiré" }, toast: { saved: "Ajouté au portefeuille", alreadySaved: "Déjà dans le portefeuille" } } },
  "zh-CN": { common: { login: { title: "欢迎", email: "电子邮箱", password: "密码", signIn: "登录", language: "语言", theme: "主题" }, settings: { title: "资料与设置", language: "语言", theme: "主题", dark: "深色", light: "浅色", system: "系统" }, wallet: { title: "钱包", coupons: "优惠券", saved: "已保存", expired: "已过期", daysLeft: "剩余 {{count}} 天" }, coupon: { save: "保存到钱包", redeem: "核销", expiresIn: "将在 {{time}} 后过期", expired: "已过期" }, toast: { saved: "已保存到钱包", alreadySaved: "已在钱包中" } } }
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({ resources, fallbackLng: "en", defaultNS: "common", ns: ["common"], interpolation: { escapeValue: false }, detection: { order: ["querystring","localStorage","navigator"], caches: ["localStorage"] } });
}

// -------------------------------------------------
// 1) Brand CSS Variables (light/dark + accessibility)
// -------------------------------------------------
function BrandStyles(){
  useEffect(()=>{
    const css = `
      :root{
        --color-primary:#B6FF00; /* Signal Lime */
        --color-bg:#F8FAFC;      /* Cloud Mist */
        --color-surface:#EDE9D5; /* Desert Sand */
        --color-light:#F8FAFC;   /* Cloud Mist (alias) */
        --color-accent:#334155;  /* Metro Slate */
        --color-ink:#0B1020;     /* Midnight Ink */
        --color-ink-inverse:#0B1020;
      }
      .dark{
        --color-primary:#B6FF00;
        --color-bg:#0B1020;      /* Midnight Ink */
        --color-surface:#334155;  /* Metro Slate */
        --color-light:#0B1020;
        --color-accent:#B6FF00;
        --color-ink:#FFFFFF;     /* enforce high contrast */
        --color-ink-inverse:#0B1020;
        color-scheme: dark;
      }
      body{ background:var(--color-bg); color:var(--color-ink); }
      .card-surface{ background: color-mix(in lab, var(--color-surface), transparent 15%); border:1px solid color-mix(in lab, var(--color-surface), transparent 65%); }
      .btn-primary{ background: var(--color-primary); color:#0B1020; }
      .btn-primary[disabled]{ opacity:.6; }
      a{ color: var(--color-primary); }
      .dark ::placeholder{ color: rgba(255,255,255,.75); }
      /* quick contrast guards for Tailwind slate tokens in dark */
      .dark .text-slate-500{ color: rgba(255,255,255,.8)!important; }
      .dark .text-slate-300{ color: rgba(255,255,255,.9)!important; }
      .dark .border-slate-200{ border-color: rgba(148,163,184,.35)!important; }
      .dark .border-slate-800{ border-color: rgba(148,163,184,.35)!important; }
    `;
    const el = document.createElement('style');
    el.setAttribute('data-brand', 'tokens');
    el.appendChild(document.createTextNode(css));
    document.head.appendChild(el);
    return ()=>{ document.head.removeChild(el); };
  },[]);
  return null;
}

// -----------------------------
// 2) Theme Provider (system sync)
// -----------------------------
const ThemeCtx = createContext(null);
const THEME_KEY = "theme_pref"; // 'light' | 'dark' | 'system'

function ThemeProvider({ children, defaultTheme='system' }){
  const [theme, setTheme] = useState(()=> localStorage.getItem(THEME_KEY) || defaultTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(()=>{
    localStorage.setItem(THEME_KEY, theme);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', dark);
    setIsDark(dark);
  }, [theme]);

  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e)=>{
      if ((localStorage.getItem(THEME_KEY) || 'system')==='system'){
        document.documentElement.classList.toggle('dark', e.matches);
        setIsDark(e.matches);
      }
    };
    mq.addEventListener?.('change', handler);
    return ()=> mq.removeEventListener?.('change', handler);
  },[]);

  const value = useMemo(()=>({ theme, setTheme, isDark }), [theme, isDark]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
function useTheme(){ return useContext(ThemeCtx); }

// ----------------------------------
// 3) Local coupon storage (30-day)
// ----------------------------------
const COUPON_KEY = 'wallet_coupons_v2';
const DAY = 24*60*60*1000;
function loadCoupons(){ try { return JSON.parse(localStorage.getItem(COUPON_KEY))||[]; } catch { return []; } }
function saveCoupons(list){ localStorage.setItem(COUPON_KEY, JSON.stringify(list)); }
function upsertCoupon(c){ const list = loadCoupons(); const ex = list.find(x=>x.id===c.id); if (ex) return {added:false, list}; const next=[c,...list]; saveCoupons(next); return {added:true, list:next}; }
function isExpired(c, now=Date.now()){ return now >= c.expiresAt || c.status==='expired'; }
function timeLeft(c, now=Date.now()){ const ms=Math.max(0,(c.expiresAt||0)-now); const days=Math.floor(ms/DAY); const hours=Math.floor((ms%DAY)/3600000); const mins=Math.floor((ms%3600000)/60000); const secs=Math.floor((ms%60000)/1000); return {ms,days,hours,mins,secs}; }
function markRedeemed(id){ const list=loadCoupons(); const next=list.map(c=> c.id===id?{...c,status:'redeemed'}:c); saveCoupons(next); return next; }
function expireSweep(now=Date.now()){ const list=loadCoupons(); const next=list.map(c=> isExpired(c, now)?{...c,status:'expired'}:c); saveCoupons(next); return next; }

// ----------------------------------
// 4) Sample Data
// ----------------------------------
const SAMPLE_TRIPS = [
  { id: "taipei-food", city: "Taipei", name: "Taipei Street Food Bites", theme: "Food", durationMin: 90,
    stops: [
      { id: "tf-1", title: "Shilin Night Market", short: "Intro to night‑market culture", lat: 25.088, lng: 121.525 },
      { id: "tf-2", title: "Pepper Bun Stall", short: "Why the ovens face the street", lat: 25.089, lng: 121.526 },
      { id: "tf-3", title: "Bubble Tea Origin Story", short: "From Taichung to the world", lat: 25.085, lng: 121.524 },
      { id: "tf-4", title: "Oyster Omelette", short: "Crisp edge secrets", lat: 25.087, lng: 121.523 },
      { id: "tf-5", title: "Sweet Potato Balls", short: "Perfect chew explained", lat: 25.086, lng: 121.522 }
    ],
    coupon: { partner: "Night Market Combo", code: "TAI-FOOD-2025", minutes: 5 }
  },
  { id: "munich-highlights", city: "Munich", name: "Munich Main Attractions Walk", theme: "Sights", durationMin: 120,
    stops: [
      { id: "mh-1", title: "Marienplatz", short: "Glockenspiel timing", lat: 48.137, lng: 11.575 },
      { id: "mh-2", title: "Frauenkirche", short: "Devil's footprint myth", lat: 48.138, lng: 11.573 },
      { id: "mh-3", title: "Viktualienmarkt", short: "From food stalls to festivals", lat: 48.135, lng: 11.576 },
      { id: "mh-4", title: "Residenz", short: "Wittelsbach legacy", lat: 48.141, lng: 11.579 },
      { id: "mh-5", title: "English Garden", short: "The river surfers", lat: 48.160, lng: 11.603 }
    ],
    coupon: { partner: "Bavarian Pretzel + Drink", code: "MUC-HI-2025", minutes: 5 }
  }
];

const SCREENS = { ONBOARDING: "ONBOARDING", HOME: "HOME", TRIPS: "TRIPS", WALLET: "WALLET", PROFILE: "PROFILE", TRIP_OVERVIEW: "TRIP_OVERVIEW", TRIP_PROGRESS: "TRIP_PROGRESS", STOP_DETAIL: "STOP_DETAIL", STORY_PLAYER: "STORY_PLAYER", TRIP_COMPLETED: "TRIP_COMPLETED", COUPON_REDEEM: "COUPON_REDEEM", THANK_YOU: "THANK_YOU", FREE_SCAN: "FREE_SCAN" };

// ----------------------------------
// 5) UI helpers
// ----------------------------------
const cx = (...classes) => classes.filter(Boolean).join(" ");
const Card = ({ children, className = "" }) => (
  <div className={cx("rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4", "card-surface", className)}>
    {children}
  </div>
);
const PrimaryButton = ({ children, onClick, className = "", icon: Icon, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={cx("inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl font-semibold shadow btn-primary", disabled && "cursor-not-allowed" , className)}>
    {Icon ? <Icon size={18} /> : null}
    <span>{children}</span>
  </button>
);
const Chip = ({ children, active, onClick }) => (
  <button onClick={onClick} className={cx("px-3 py-1 rounded-full text-sm border", active?"bg-[var(--color-primary)] text-[#0B1020] border-[var(--color-primary)]":"bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200")}>{children}</button>
);
const ProgressBar = ({ value, max = 100 }) => (
  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
    <div className="h-full" style={{ background:"#16a34a", width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
);

// ----------------------------------
// 6) Root App
// ----------------------------------
export default function App(){
  return (
    <ThemeProvider>
      <BrandStyles />
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner(){
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [screen, setScreen] = useState(SCREENS.ONBOARDING);
  const [authed, setAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [trips] = useState(SAMPLE_TRIPS);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [completedStopIds, setCompletedStopIds] = useState([]);
  const [coins, setCoins] = useState(0);
  const [activeCoupon, setActiveCoupon] = useState(null); // ephemeral (minutes)
  const [couponRedeemed, setCouponRedeemed] = useState(false);
  const [walletCoupons, setWalletCoupons] = useState(()=> expireSweep());
  const [selectedSavedCoupon, setSelectedSavedCoupon] = useState(null);

  useEffect(()=>{ const id=setInterval(()=> setWalletCoupons(expireSweep()), 1000); return ()=>clearInterval(id); },[]);

  const navTo = (next) => setScreen(next);
  const startTrip = (trip) => { setCurrentTrip(trip); setCompletedStopIds([]); navTo(SCREENS.TRIP_PROGRESS); };

  const markStopDone = (stopId) => {
    if (!completedStopIds.includes(stopId)) {
      const next = [...completedStopIds, stopId];
      setCompletedStopIds(next);
      if (currentTrip && next.length === currentTrip.stops.length) {
        const earned = 50; setCoins((c) => c + earned);
        const coupon = { partner: currentTrip.coupon.partner, code: currentTrip.coupon.code, minutes: currentTrip.coupon.minutes, expiresAt: Date.now() + currentTrip.coupon.minutes * 60 * 1000 };
        setActiveCoupon(coupon); setCouponRedeemed(false); navTo(SCREENS.TRIP_COMPLETED);
      }
    }
  };

  // Save ephemeral coupon to persistent Wallet (30 days)
  const saveActiveToWallet = ()=>{
    const issuedAt = Date.now();
    // Build title from trip if available, else generic
    const title = currentTrip ? `${currentTrip.name} — ${currentTrip.coupon.partner}` : "Local Partner Offer";
    const id = currentTrip ? `trip-${currentTrip.id}-${issuedAt}` : `cp_${issuedAt}`;
    const model = { id, title, merchantId: currentTrip? currentTrip.id : "merchant_demo", issuedAt, expiresAt: issuedAt + (30*DAY), status: "saved", redeemCode: currentTrip? currentTrip.coupon.code : "DEMO-30D-SAVE", qrPayload: `coupon://${id}` };
    const { added, list } = upsertCoupon(model);
    setWalletCoupons(list);
    return added ? 'saved' : 'alreadySaved';
  };

  const onRedeemSaved = (c)=>{ setSelectedSavedCoupon(c); navTo(SCREENS.COUPON_REDEEM); };

  const resetToHome = () => navTo(SCREENS.HOME);
  const isDark = document.documentElement.classList.contains('dark');

  const Page = ({ title, children, showTabs = true }) => (
    <div className="w-full min-h-screen" style={{background:"var(--color-bg)", color:"var(--color-ink)"}}>
      <div className="mx-auto max-w-[420px] min-h-screen bg-transparent border-x border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 z-10 backdrop-blur" style={{background:"color-mix(in lab, var(--color-bg), transparent 25%)", borderBottom:"1px solid rgba(148,163,184,.3)"}}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="text-[var(--color-primary)]" size={20} />
              <h1 className="font-bold" style={{color:"var(--color-ink)"}}>{title}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="p-4 pb-24">{children}</div>
        {showTabs ? (
          <div className="fixed bottom-0 left-0 right-0">
            <div className="mx-auto max-w-[420px]">
              <nav className="grid grid-cols-4 gap-1 border-t border-slate-200 dark:border-slate-800" style={{background:"color-mix(in lab, var(--color-bg), transparent 10%)", backdropFilter:"blur(8px)"}}>
                <Tab icon={HomeIcon} label="Home" active={screen===SCREENS.HOME} onClick={()=>navTo(SCREENS.HOME)} />
                <Tab icon={List} label="Trips" active={screen===SCREENS.TRIPS} onClick={()=>navTo(SCREENS.TRIPS)} />
                <Tab icon={WalletIcon} label={t('wallet.title')} active={screen===SCREENS.WALLET} onClick={()=>navTo(SCREENS.WALLET)} />
                <Tab icon={User} label="Profile" active={screen===SCREENS.PROFILE} onClick={()=>navTo(SCREENS.PROFILE)} />
              </nav>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div>
      <AnimatePresence mode="wait">
        {screen === SCREENS.ONBOARDING && (
          <Onboarding key="onboard" onGetStarted={() => setShowLogin(true)} onSkip={() => setShowLogin(true)} />
        )}
        {screen !== SCREENS.ONBOARDING && (
          <motion.div key={screen} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} transition={{duration:0.2}}>
            {screen === SCREENS.HOME && (
              <Page title="Home">
                <HomeView onScan={()=>setScreen(SCREENS.STOP_DETAIL)} onStartTrip={(t)=>{setCurrentTrip(t); setScreen(SCREENS.TRIP_OVERVIEW);}} trips={trips} />
              </Page>
            )}
            {screen === SCREENS.TRIPS && (
              <Page title="Trips">
                <TripsLibrary trips={trips} onOpen={(t)=>{setCurrentTrip(t); setScreen(SCREENS.TRIP_OVERVIEW);}} />
              </Page>
            )}
            {screen === SCREENS.WALLET && (
              <Page title={t('wallet.title')}>
                <WalletView coins={coins} activeCoupon={activeCoupon} onUseCoupon={()=>setScreen(SCREENS.COUPON_REDEEM)} savedCoupons={walletCoupons} onRedeemSaved={onRedeemSaved} />
              </Page>
            )}
            {screen === SCREENS.PROFILE && (
              <Page title={t('settings.title')}>
                <ProfileView theme={theme} setTheme={setTheme} authed={authed} onLogout={()=>setAuthed(false)} onLogin={()=>setShowLogin(true)} />
              </Page>
            )}
            {screen === SCREENS.TRIP_OVERVIEW && currentTrip && (
              <Page title="Trip Overview">
                <TripOverview trip={currentTrip} onStart={()=>startTrip(currentTrip)} onBack={()=>setScreen(SCREENS.TRIPS)} />
              </Page>
            )}
            {screen === SCREENS.TRIP_PROGRESS && currentTrip && (
              <Page title="Trip Progress">
                <TripProgress trip={currentTrip} completed={completedStopIds} onScanNext={()=>setScreen(SCREENS.STOP_DETAIL)} />
              </Page>
            )}
            {screen === SCREENS.STOP_DETAIL && currentTrip && (
              <Page title="Stop Detail">
                <StopDetail trip={currentTrip} completed={completedStopIds} onMarkDone={(sid)=>markStopDone(sid)} onPlay={()=>setScreen(SCREENS.STORY_PLAYER)} />
              </Page>
            )}
            {screen === SCREENS.STORY_PLAYER && currentTrip && (
              <Page title="Story Player">
                <StoryPlayer onDone={()=>setScreen(SCREENS.STOP_DETAIL)} />
              </Page>
            )}
            {screen === SCREENS.TRIP_COMPLETED && (
              <Page title="Trip Completed" showTabs={false}>
                <TripCompleted coinsAdded={50} onUseCoupon={()=>setScreen(SCREENS.COUPON_REDEEM)} onRate={()=>setScreen(SCREENS.THANK_YOU)} onAnother={()=>setScreen(SCREENS.TRIPS)} onSaveToWallet={saveActiveToWallet} />
              </Page>
            )}
            {screen === SCREENS.COUPON_REDEEM && (
              <Page title="Coupon Redeem" showTabs={false}>
                <CouponRedeem coupon={selectedSavedCoupon || activeCoupon} isSaved={!!selectedSavedCoupon} redeemed={couponRedeemed} onMarked={()=>{
                  if (selectedSavedCoupon){
                    markRedeemed(selectedSavedCoupon.id);
                    setWalletCoupons(expireSweep());
                    setSelectedSavedCoupon(null);
                  } else {
                    setCouponRedeemed(true);
                  }
                }} onBack={()=>{ setSelectedSavedCoupon(null); setScreen(selectedSavedCoupon?SCREENS.WALLET:SCREENS.TRIP_COMPLETED); }} />
              </Page>
            )}
            {screen === SCREENS.THANK_YOU && (
              <Page title="Thank-you & Review" showTabs={false}>
                <ThankYou onHome={resetToHome} />
              </Page>
            )}
            {screen === SCREENS.FREE_SCAN && (
              <Page title="Free Scan Result">
                <FreeScanResult trip={trips[0]} onJoin={()=>{setCurrentTrip(trips[0]); setScreen(SCREENS.TRIP_OVERVIEW);}} />
              </Page>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal open={showLogin} setOpen={setShowLogin} view={authView} setView={setAuthView} onAuthed={()=>{ setAuthed(true); setShowLogin(false); setScreen(SCREENS.HOME); }} />
    </div>
  );
}

function ThemeToggle(){
  const { theme, setTheme } = useTheme();
  const order = ['light','dark','system'];
  const labels = { light: 'Light', dark:'Dark', system:'System' };
  const cycle = () => { const next = order[(order.indexOf(theme)+1)%order.length]; setTheme(next); };
  return (
    <button onClick={cycle} className="text-xs px-2 py-1 rounded-full border" title="Toggle theme" style={{borderColor:"rgba(148,163,184,.4)", color:"var(--color-ink)"}}>
      {labels[theme]}
    </button>
  );
}

function Tab({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={cx("flex items-center justify-center gap-1 py-2 text-sm", active ? "text-[var(--color-primary)]" : "text-slate-600 dark:text-slate-300")}> 
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function Onboarding({ onGetStarted, onSkip }) {
  const [step, setStep] = useState(1);
  const steps = [
    { title: "Scan.", text: "Point your camera at city QR tags to unlock micro‑stories.", icon: <QrCode className="text-[var(--color-primary)]" size={28} /> },
    { title: "Discover.", text: "Hear 30–60s stories in multiple languages — hands‑free.", icon: <Headphones className="text-emerald-700" size={28} /> },
    { title: "Collect.", text: "Complete trips, earn coins, and redeem local perks.", icon: <Ticket className="text-amber-600" size={28} /> },
  ];
  return (
    <div className="w-full min-h-screen grid place-items-center" style={{ background:"linear-gradient(to bottom, rgba(14,116,144,.08), rgba(22,101,52,.06))" }}>
      <Card className="max-w-[420px] w-[92%]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Step {step}/3</span>
          <button className="text-xs text-slate-500 hover:text-slate-700" onClick={onSkip}>Skip</button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          {steps[step-1].icon}
          <h2 className="text-xl font-bold">{steps[step-1].title}</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-4">{steps[step-1].text}</p>
        {step === 1 && (<PermissionToggle label="Allow Camera" />)}
        {step === 2 && (<PermissionToggle label="Allow Location" />)}
        {step === 3 && (<div className="text-xs text-slate-500 mb-2">You can change permissions anytime in Settings.</div>)}
        <div className="flex gap-2 mt-4">
          {step > 1 && (
            <button className="px-4 py-2 rounded-xl border text-slate-700 dark:text-slate-200" onClick={()=>setStep(step-1)}>
              <ChevronLeft size={16} className="inline"/> Back
            </button>
          )}
          {step < 3 ? (
            <PrimaryButton onClick={()=>setStep(step+1)} icon={ChevronRight}>Next</PrimaryButton>
          ) : (
            <PrimaryButton onClick={onGetStarted} icon={CheckCircle2}>Get Started</PrimaryButton>
          )}
        </div>
      </Card>
    </div>
  );
}

function PermissionToggle({ label }) {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <span className="text-sm">{label}</span>
      <button onClick={()=>setOn(!on)} className={cx("px-3 py-1 rounded-full text-xs border", on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700")}>{on?"Allowed":"Denied"}</button>
    </div>
  );
}

function LanguagePicker({ className="" }){
  const { i18n } = useTranslation();
  const LANGS = [ { code: "en", label: "English" }, { code: "de", label: "Deutsch" }, { code: "fr", label: "Français" }, { code: "zh-CN", label: "中文" } ];
  return (
    <select className={cx("bg-transparent border rounded-xl px-2 py-1 text-sm", className)} value={i18n.language} onChange={(e)=> i18n.changeLanguage(e.target.value)}>
      {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  );
}

function AuthModal({ open, setOpen, view, setView, onAuthed }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [code, setCode] = useState(["","","",""]);
  const [timer, setTimer] = useState(60);

  useEffect(()=>{ if (open && view === "verify" && timer>0){ const t = setTimeout(()=>setTimer((s)=>s-1), 1000); return ()=>clearTimeout(t); } }, [open, view, timer]);
  const strength = useMemo(()=>{ let score = 0; if (password.length>=8) score++; if (/[A-Z]/.test(password)) score++; if (/[0-9]/.test(password)) score++; if (/[^A-Za-z0-9]/.test(password)) score++; return score; }, [password]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-[92%] max-w-[420px]">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {view === "login" && t('login.title')}
              {view === "forgot" && "Reset your password"}
              {view === "verify" && "Enter verification code"}
              {view === "reset" && "Set a new password"}
            </h3>
            <button className="text-sm text-slate-500" onClick={()=>setOpen(false)}><Close size={16}/></button>
          </div>
          {view === "login" && (
            <div className="space-y-3">
              <LabeledInput icon={Mail} placeholder={t('login.email')} type="email" value={email} onChange={e=>setEmail(e.target.value)} />
              <LabeledInput icon={Phone} placeholder="Phone (optional)" value={phone} onChange={e=>setPhone(e.target.value)} />
              <div className="relative">
                <LabeledInput icon={Lock} placeholder={t('login.password')} type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} />
                <button className="absolute right-3 top-2.5 text-slate-500" onClick={()=>setShowPass(!showPass)}>{showPass ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
              <PasswordMeter score={strength} />
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded"/> Remember me</label>
                <button onClick={()=>setView("forgot")} className="text-[var(--color-primary)]">Forgot password?</button>
              </div>
              <PrimaryButton onClick={()=>setView("verify")} icon={CheckCircle2}>{t('login.signIn')}</PrimaryButton>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">{t('login.language')}</div>
                <LanguagePicker />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">{t('login.theme')}</div>
                <ThemeToggle />
              </div>
              <div className="text-[11px] text-slate-500">By continuing you agree to our <a className="underline" href="#">Terms</a> and <a className="underline" href="#">Privacy</a>.</div>
            </div>
          )}
          {view === "forgot" && (
            <div className="space-y-3">
              <LabeledInput icon={Mail} placeholder="Your email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
              <PrimaryButton onClick={()=>{setTimer(60); setView("verify");}} icon={Mail}>Send reset code</PrimaryButton>
              <button onClick={()=>setView("login")} className="text-sm text-slate-500">Back to login</button>
            </div>
          )}
          {view === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">Enter the 4‑digit code we sent to {email||"your email"}.</p>
              <div className="flex items-center justify-between gap-2">
                {code.map((d, i)=> (
                  <input key={i} maxLength={1} value={code[i]} onChange={(e)=>{ const v = e.target.value.replace(/[^0-9]/g,""); const next = [...code]; next[i] = v; setCode(next); }} className="w-12 h-12 text-center text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                ))}
              </div>
              <PrimaryButton onClick={()=>onAuthed()} icon={CheckCircle2}>Verify</PrimaryButton>
              <button disabled={timer>0} onClick={()=>setTimer(60)} className={cx("text-sm", timer>0?"text-slate-400":"text-[var(--color-primary)]")}>{timer>0?`Resend code in ${timer}s`:"Resend code"}</button>
            </div>
          )}
          {view === "reset" && (
            <div className="space-y-3">
              <LabeledInput icon={Lock} placeholder="New password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              <PasswordMeter score={strength} />
              <PrimaryButton onClick={()=>setView("login")} icon={CheckCircle2}>Save new password</PrimaryButton>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function LabeledInput({ icon: Icon, ...props }){
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
      {Icon ? <Icon size={16} className="text-slate-500"/> : null}
      <input {...props} className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-white/70" />
    </div>
  );
}
function PasswordMeter({ score }){
  const labels = ["Very weak","Weak","Okay","Strong","Very strong"];
  return (
    <div>
      <div className="flex gap-1 mb-1">
        {Array.from({length:4}).map((_,i)=> (
          <div key={i} className={cx("h-1.5 flex-1 rounded", i<score ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700")}></div>
        ))}
      </div>
      <div className="text-[11px] text-slate-500">{labels[score]}</div>
    </div>
  );
}

function HomeView({ onScan, onStartTrip, trips }){
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Nearby stories</h3>
            <p className="text-sm text-slate-500">Explore what’s around you</p>
          </div>
          <button className="px-3 py-2 rounded-xl border text-sm flex items-center gap-1" onClick={onScan}><Camera size={16}/> Scan QR</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {trips.map(t => (
            <div key={t.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-semibold">{t.city}</div>
              <div className="text-xs text-slate-500">{t.name}</div>
              <button onClick={()=>onStartTrip(t)} className="mt-2 text-xs text-[var(--color-primary)]">Open overview →</button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Free scan you found on the street?</div>
          <button className="text-xs text-[var(--color-primary)]" onClick={()=>onScan()}>Try demo →</button>
        </div>
      </Card>
    </div>
  );
}

function TripsLibrary({ trips, onOpen }){
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const cats = ["All","Food","Sights"];
  const list = trips.filter(t => (filter==="All" || t.theme===filter) && (t.name.toLowerCase().includes(q.toLowerCase()) || t.city.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1">
          <Search size={16} className="text-slate-500"/>
          <input placeholder="Search trips" value={q} onChange={(e)=>setQ(e.target.value)} className="w-full bg-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-white/70"/>
        </div>
        <button className="px-3 py-2 rounded-xl border text-sm flex items-center gap-1"><Filter size={16}/> Filter</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cats.map(c => <Chip key={c} active={filter===c} onClick={()=>setFilter(c)}>{c}</Chip>)}
      </div>
      <div className="space-y-2">
        {list.map(t => (
          <Card key={t.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{t.city} • {t.theme}</div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-slate-500">≈ {t.durationMin} min • {t.stops.length} stops</div>
              </div>
              <button className="text-[var(--color-primary)] text-sm" onClick={()=>onOpen(t)}>Open →</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WalletView({ coins, activeCoupon, onUseCoupon, savedCoupons, onRedeemSaved }){
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2"><WalletIcon size={18}/><div className="font-semibold">Coins</div></div>
        <div className="text-2xl font-bold mt-1">{coins}</div>
        <div className="text-xs text-slate-500">Earn coins by finishing trips</div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-2"><Ticket size={18}/><div className="font-semibold">{t('wallet.coupons')}</div></div>
        {activeCoupon ? (
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium">{activeCoupon.partner}</div>
              <CouponExpiry expiresAt={activeCoupon.expiresAt}/>
            </div>
            <button className="text-[var(--color-primary)] text-sm" onClick={onUseCoupon}>Use →</button>
          </div>
        ) : null}

        <div className="space-y-2">
          {(!savedCoupons || savedCoupons.length===0) && (
            <div className="text-sm text-slate-500">No saved coupons</div>
          )}
          {savedCoupons && savedCoupons.map(c => {
            const tl = timeLeft(c);
            const expired = isExpired(c);
            const meta = expired ? t('wallet.expired') : `Expires in ${tl.days}d ${tl.hours}h ${tl.mins}m`;
            const disabled = expired || c.status==='redeemed';
            return (
              <div key={c.id} className="p-3 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-slate-500">{meta}</div>
                </div>
                <button className="px-3 py-1 rounded-xl border text-sm" disabled={disabled} onClick={()=>onRedeemSaved(c)}>
                  {expired ? t('coupon.expired') : (c.status==='redeemed' ? t('coupon.redeem')+" ✓" : t('coupon.redeem'))}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">Saved places</div>
        <div className="text-sm text-slate-500">You have none saved yet.</div>
      </Card>
    </div>
  );
}

function CouponExpiry({ expiresAt }){
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(()=>{ const t = setInterval(()=>setLeft(Math.max(0, expiresAt - Date.now())), 1000); return ()=>clearInterval(t); }, [expiresAt]);
  const mm = String(Math.floor(left/60000)).padStart(2,"0");
  const ss = String(Math.floor((left%60000)/1000)).padStart(2,"0");
  return <div className="text-xs text-slate-500">Expires in {mm}:{ss}</div>;
}

function ProfileView({ theme, setTheme, authed, onLogout, onLogin }){
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full" style={{background:"color-mix(in lab, var(--color-surface), transparent 30%)"}}/>
            <div>
              <div className="font-semibold">Traveler</div>
              <div className="text-xs text-slate-500">{authed?"Logged in":"Guest"}</div>
            </div>
          </div>
          {authed ? (
            <button className="text-sm flex items-center gap-1" onClick={onLogout}><LogOut size={16}/> Logout</button>
          ) : (
            <button className="text-sm text-[var(--color-primary)]" onClick={onLogin}>Sign in</button>
          )}
        </div>
      </Card>
      <Card>
        <div className="font-semibold mb-2">{t('settings.title')}</div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><Languages size={16}/> {t('settings.language')}</div>
          <LanguagePicker />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><SubtleIcon/><span>Captions default</span></div>
          <input type="checkbox" defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><DownloadIcon/><span>Allow downloads on Wi‑Fi</span></div>
          <input type="checkbox" defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><Shield size={16}/> Privacy: share anonymous stats</div>
          <input type="checkbox" defaultChecked />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2"><Sun size={16}/> {t('settings.theme')}</div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setTheme("light")} className={cx("px-2 py-1 rounded-xl border text-xs", theme==="light"?"bg-slate-100 dark:bg-slate-800":"")}>{t('settings.light')}</button>
            <button onClick={()=>setTheme("dark")} className={cx("px-2 py-1 rounded-xl border text-xs", theme==="dark"?"bg-slate-100 dark:bg-slate-800":"")}>{t('settings.dark')}</button>
            <button onClick={()=>setTheme("system")} className={cx("px-2 py-1 rounded-xl border text-xs", theme==="system"?"bg-slate-100 dark:bg-slate-800":"")}>{t('settings.system')}</button>
          </div>
        </div>
      </Card>
      <BrandDemo />
    </div>
  );
}

function SubtleIcon(){return <span className="inline-block w-3 h-3 rounded-full bg-slate-400"/>}
function DownloadIcon(){return <span className="inline-block w-3 h-3 rounded bg-slate-400"/>}

function TripOverview({ trip, onStart, onBack }){
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-slate-500">← Back to trips</button>
      <Card>
        <div className="text-xs uppercase tracking-wide text-slate-500">{trip.city} • {trip.theme}</div>
        <h2 classN
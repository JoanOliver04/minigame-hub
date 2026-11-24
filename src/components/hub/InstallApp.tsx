"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";

interface InstallEvent extends Event {
  prompt(): Promise<unknown>;
}

export function InstallApp() {
  const { t } = useLocale();
  const pending = useRef<InstallEvent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)");
    const checkDisplay = () => setInstalled(standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const capture = (event: Event) => { event.preventDefault(); pending.current = event as InstallEvent; };
    const onInstalled = () => { pending.current = null; setInstalled(true); };
    checkDisplay();
    standalone.addEventListener("change", checkDisplay);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    }
    return () => {
      standalone.removeEventListener("change", checkDisplay);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  async function install() {
    const event = pending.current;
    pending.current = null;
    if (event) {
      try { await event.prompt(); return; } catch { /* Use the browser's menu instructions. */ }
    }
    dialog.current?.showModal();
  }
  return <>
    <button className="btn app-room-link" type="button" onClick={install}>{t.app.install}</button>
    <dialog ref={dialog} className="htp-modal" aria-labelledby="install-heading">
      <div className="htp-head"><h2 id="install-heading">{t.app.install} Mini-Game Hub</h2></div>
      <div className="htp-body"><p>{t.app.installMobile}</p><p>{t.app.installDesktop}</p></div>
      <form method="dialog" className="btn-row"><button className="btn primary">{t.common.close}</button></form>
    </dialog>
  </>;
}

import React, { useEffect, useState } from "react";
import { GeminiIcon } from "@/components/icons/GoogleIcons";

type GeminiIntroProps = {
  show: boolean;
  onDone: () => void;
};

export function GeminiIntro({ show, onDone }: GeminiIntroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2600);

    return () => window.clearTimeout(t);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background gemini-intro"
      role="dialog"
      aria-label="Workspace intro animation"
      aria-modal="true"
    >
      <div className="gemini-intro__stage">
        <div className="gemini-intro__glow" aria-hidden="true" />
        <div className="gemini-intro__mark" aria-hidden="true">
          <GeminiIcon className="gemini-intro__icon" />
        </div>
        <p className="gemini-intro__text">Gemini Workspace</p>
      </div>
    </div>
  );
}

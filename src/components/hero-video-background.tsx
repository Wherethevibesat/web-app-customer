"use client";

import { useEffect, useState } from "react";

type HeroVideoBackgroundProps = {
  src: string;
  webmSrc?: string;
  poster?: string;
};

export function HeroVideoBackground({ src, webmSrc, poster }: HeroVideoBackgroundProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const overlay = (
    <div
      className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-background"
      aria-hidden
    />
  );

  if (reduceMotion) {
    return (
      <>
        {poster ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${poster})` }}
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-wtva-dark-300 via-background to-background"
            aria-hidden
          />
        )}
        {overlay}
      </>
    );
  }

  return (
    <>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        aria-hidden
      >
        {webmSrc && <source src={webmSrc} type="video/webm" />}
        <source src={src} type="video/mp4" />
      </video>
      {overlay}
    </>
  );
}

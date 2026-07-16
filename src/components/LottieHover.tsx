"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  size?: number;
  className?: string;
}

export default function LottieHover({ src, size = 120, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    let destroyed = false;

    import("lottie-web").then((mod) => {
      if (destroyed || !ref.current) return;
      animRef.current = mod.default.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: src,
      });
    });

    return () => {
      destroyed = true;
      animRef.current?.destroy();
    };
  }, [src]);

  const play = () => animRef.current?.goToAndPlay(0, true);

  return (
    <div
      ref={ref}
      style={{ width: size, height: size }}
      className={className}
      onMouseEnter={play}
    />
  );
}

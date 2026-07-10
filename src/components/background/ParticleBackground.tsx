import { Particles, ParticlesProvider } from "@tsparticles/react";
import { loadStarsPreset } from "@tsparticles/preset-stars";
import { useCallback, useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

function getIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function ParticleBackground() {
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsDark(getIsDark());
    setIsMobile(getIsMobile());

    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ParticlesProvider init: called once to set up the tsParticles engine
  // with the stars preset. Without ParticlesProvider, the Particles
  // component never fires its load() because loaded context stays false.
  const engineInit = useCallback(async () => {
    const engine = await import("@tsparticles/engine");
    await loadStarsPreset(engine.tsParticles);
  }, []);

  const options = {
    preset: "stars",
    fullScreen: false,
    background: {
      color: "transparent",
    },
    particles: {
      number: {
        value: isMobile ? 40 : 70,
      },
      color: {
        value: isDark ? ["#2997ff", "#ffffff"] : ["#f59e0b", "#fbbf24"],
      },
      move: {
        enable: true,
        speed: 0.3,
        random: true,
        straight: false,
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: true,
          mode: "repulse",
        },
      },
      modes: {
        grab: {
          distance: 140,
        },
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
  };

  return (
    <ParticlesProvider init={engineInit}>
      <Particles
        id="tsparticles"
        options={options}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </ParticlesProvider>
  );
}

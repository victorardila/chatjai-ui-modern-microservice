import { useCallback, useMemo } from 'react';
import Particles from '@tsparticles/react';
import { Engine } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { useTheme } from '../contexts/ThemeContext';

interface BackgroundCanvasProps {
  isBlurred: boolean;
}

export function BackgroundCanvas({ isBlurred }: BackgroundCanvasProps) {
  const { theme } = useTheme();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const darkModeConfig = useMemo(
    () => ({
      background: {
        color: {
          value: '#070B14',
        },
      },
      particles: {
        number: {
          value: 120,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: ['#ffffff', '#4A90E2', '#7B68EE', '#9B59B6'],
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.6,
          random: true,
          anim: {
            enable: true,
            speed: 0.5,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 2,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.5,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: 'none' as const,
          random: true,
          straight: false,
          out_mode: 'out' as const,
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas' as const,
        events: {
          onhover: {
            enable: false,
          },
          onclick: {
            enable: false,
          },
          resize: true,
        },
      },
      retina_detect: true,
    }),
    []
  );

  const lightModeConfig = useMemo(
    () => ({
      background: {
        color: {
          value: '#F3F6FC',
        },
      },
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: ['#00FF88', '#00D9FF', '#FF6B9D', '#FFC940'],
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.4,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 3,
            size_min: 1,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 1,
          direction: 'none' as const,
          random: true,
          straight: false,
          out_mode: 'out' as const,
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas' as const,
        events: {
          onhover: {
            enable: false,
          },
          onclick: {
            enable: false,
          },
          resize: true,
        },
      },
      retina_detect: true,
    }),
    []
  );

  return (
    <>
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={theme === 'dark' ? darkModeConfig : lightModeConfig}
        className={`fixed inset-0 transition-all duration-500 ${
          isBlurred ? 'blur-[10px] brightness-75' : 'blur-0'
        }`}
      />
      {theme === 'dark' && (
        <div
          className={`fixed inset-0 pointer-events-none transition-all duration-500 ${
            isBlurred ? 'blur-[10px] brightness-75' : 'blur-0'
          }`}
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(75, 0, 130, 0.15), transparent 50%), radial-gradient(ellipse at bottom, rgba(25, 25, 112, 0.1), transparent 50%)',
          }}
        />
      )}
    </>
  );
}

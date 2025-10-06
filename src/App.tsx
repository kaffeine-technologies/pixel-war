// src/pages/MainPage.tsx
import React from 'react';
import { useNavigate } from 'react-router';
import LanguageSwitcher from './components/molecules/change-lang';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStart = () => {
    navigate('/canvas');
  };

  return (
    <div className="w-screen h-screen min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-900 via-sky-600 to-indigo-900 overflow-hidden relative p-10">
      {/* Animated Pixel Title */}
      <h1 className="text-7xl md:text-9xl font-extrabold text-white drop-shadow-lg animate-flicker tracking-widest">
        Pixel
      </h1>
      <h2 className="text-4xl md:text-6xl font-bold text-blue-900 animate-pulse mt-2 drop-shadow-md">
        War
      </h2>

      <p className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg text-center mt-8">
        {t('app.description')}
      </p>

      {/* Fireworks animation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <span
            key={i}
            className="block absolute bg-gradient-to-r from-cyan-400 to-blue-700 rounded-full animate-firework"
            style={{
              width: '8px',
              height: '8px',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="mt-16 mb-16 px-12 py-4 bg-gradient-to-r from-blue-500 to-indigo-700 rounded-full text-white text-xl font-semibold shadow-lg hover:scale-110 transition-transform duration-300"
      >
        Join the war ⚔️
      </button>

      <LanguageSwitcher />
      
      <footer className='absolute bottom-0 text-white mb-5'>
        @ 2025 - Yuri Hikari - All rights reserved
      </footer>
      {/* Fancy animations with Tailwind CSS and custom styles */}
      <style>{`
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
            text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6,
                         0 0 30px #3b82f6, 0 0 40px #3b82f6;
          }
          20%, 22%, 24%, 55% {
            opacity: 0.4;
            text-shadow: none;
          }
        }
        .animate-flicker {
          animation: flicker 3s infinite;
        }

        @keyframes firework {
          0% { transform: scale(0.2) translateY(0); opacity: 1;}
          100% { transform: scale(1.4) translateY(-140px); opacity: 0;}
        }
        .animate-firework {
          animation-name: firework;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};

export default App;

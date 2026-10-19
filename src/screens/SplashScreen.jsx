import React from 'react';
import { WelcomeScreen } from './WelcomeScreen';

export function SplashScreen(props) {
  if (props.mode === 'splash' || props.splashOnly) {
    return (
      <div 
        className="w-full h-full min-h-screen flex flex-col items-center justify-center bg-white select-none p-6"
        style={{ backgroundColor: '#FFFFFF', colorScheme: 'light' }}
      >
        <div className="w-full max-w-[180px] p-4 flex items-center justify-center bg-white" style={{ backgroundColor: '#FFFFFF' }}>
          <img
            src="/apple-touch-icon.png"
            alt="JOBit - Reliable Service Partner"
            className="w-full h-auto max-w-[180px] object-contain mx-auto"
            style={{
              maxWidth: '180px',
              width: '80%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </div>
    );
  }
  return <WelcomeScreen {...props} />;
}

export default SplashScreen;

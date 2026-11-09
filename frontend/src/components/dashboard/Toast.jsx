'use client';

// Toast — small notification bar that appears at the bottom
// Props:
//   message — text to show (empty string = hidden)

export default function Toast({ message }) {
  return (
    // Visible when message is set, invisible when empty
    // transition-opacity handles the fade in/out
    <div className={`fixed z-[60] bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm rounded-xl bg-harvest-900 text-white px-4 py-3 text-sm shadow-2xl transition-opacity duration-300 pointer-events-none ${message ? 'opacity-100' : 'opacity-0'}`}>
      {message}
    </div>
  );
}

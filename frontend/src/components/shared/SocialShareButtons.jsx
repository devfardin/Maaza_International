'use client';
// ─────────────────────────────────────────────────────────────────────────────
// SocialShareButtons — share a link to WhatsApp, Messenger, Instagram, Telegram.
//
//   <SocialShareButtons link={referralLink} text="Join me on Maaza International" />
//
// How each one works:
//   WhatsApp  — wa.me share URL with the message pre-filled.
//   Telegram  — t.me/share URL with the link and text pre-filled.
//   Messenger — the web dialog needs a Facebook App ID (NEXT_PUBLIC_FB_APP_ID).
//               Without it, mobile opens the Messenger app; desktop copies the link
//               and opens messenger.com.
//   Instagram — Instagram has no web share URL. Uses the phone's share sheet when
//               available, otherwise copies the link and opens instagram.com.
// ─────────────────────────────────────────────────────────────────────────────

import { notify } from '@/lib/toast';

const FB_APP_ID = process.env.NEXT_PUBLIC_FB_APP_ID;
const enc = encodeURIComponent;

const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function openNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function ShareIcon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (name === 'instagram') {
    return (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (name === 'telegram') {
    return (
      <svg {...common}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    );
  }
  // WhatsApp and Messenger both use a chat bubble
  return (
    <svg {...common}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'chat', className: 'bg-[#25D366]' },
  { key: 'messenger', label: 'Messenger', icon: 'chat', className: 'bg-[#0084FF]' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', className: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]' },
  { key: 'telegram', label: 'Telegram', icon: 'telegram', className: 'bg-[#229ED9]' },
];

export default function SocialShareButtons({ link, text = 'Join me on Maaza International' }) {
  const message = `${text} ${link}`;

  const shareWhatsApp = () => openNewTab(`https://wa.me/?text=${enc(message)}`);

  const shareTelegram = () => openNewTab(`https://t.me/share/url?url=${enc(link)}&text=${enc(text)}`);

  const shareMessenger = async () => {
    if (FB_APP_ID) {
      openNewTab(
        `https://www.facebook.com/dialog/send?app_id=${FB_APP_ID}&link=${enc(link)}&redirect_uri=${enc(link)}`
      );
      return;
    }
    if (isMobile()) {
      window.location.href = `fb-messenger://share/?link=${enc(link)}`;
      return;
    }
    const copied = await copyText(link);
    openNewTab('https://www.messenger.com/');
    if (copied) notify.success('Link copied. Paste it into Messenger.');
    else notify.error('Could not copy the link. Please copy it manually.');
  };

  const shareInstagram = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Maaza International', text, url: link });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user closed the share sheet
      }
    }
    const copied = await copyText(link);
    openNewTab('https://www.instagram.com/');
    if (copied) notify.success('Link copied. Paste it into your Instagram story, bio or DM.');
    else notify.error('Could not copy the link. Please copy it manually.');
  };

  const handlers = {
    whatsapp: shareWhatsApp,
    messenger: shareMessenger,
    instagram: shareInstagram,
    telegram: shareTelegram,
  };

  if (!link) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CHANNELS.map((channel) => (
        <button
          key={channel.key}
          type="button"
          onClick={handlers[channel.key]}
          className={`${channel.className} text-white rounded-md px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-soft hover:opacity-90 transition`}
        >
          <ShareIcon name={channel.icon} />
          {channel.label}
        </button>
      ))}
    </div>
  );
}

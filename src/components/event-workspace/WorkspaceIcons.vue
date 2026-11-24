<template>
  <svg
    aria-hidden="true"
    style="position: absolute; width: 0; height: 0; overflow: hidden"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <symbol id="ico-nav-overview" viewBox="0 0 24 24">
        <rect height="7" rx="1" width="7" x="4" y="4"></rect>
        <rect height="7" rx="1" width="7" x="13" y="4"></rect>
        <rect height="7" rx="1" width="7" x="4" y="13"></rect>
        <rect height="7" rx="1" width="7" x="13" y="13"></rect>
      </symbol>
      <symbol id="ico-nav-attendees" viewBox="0 0 24 24">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"></path>
        <circle cx="9" cy="7.5" r="3.2"></circle>
        <path d="M22 20v-1.5a4 4 0 0 0-3-3.85M16 4.4a3.2 3.2 0 0 1 0 6.2"></path>
      </symbol>
      <symbol id="ico-nav-promote" viewBox="0 0 24 24">
        <path d="M4 16l12-8M10 7h7v7"></path>
        <path d="M14 18h5v-5"></path>
      </symbol>
      <symbol id="ico-nav-discounts" viewBox="0 0 24 24">
        <circle cx="7" cy="7" r="2"></circle>
        <circle cx="17" cy="17" r="2"></circle>
        <path d="M18 6L6 18"></path>
      </symbol>
      <symbol id="ico-nav-messages" viewBox="0 0 24 24">
        <rect height="14" rx="2" width="18" x="3" y="5"></rect>
        <path d="M4 7l8 6 8-6"></path>
      </symbol>
      <symbol id="ico-nav-checkin" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"></path></symbol>
      <symbol id="ico-nav-earnings" viewBox="0 0 24 24">
        <path
          d="M12 2v20M16.5 6c-1-1.2-2.3-1.7-4.6-1.7-2.6 0-4.7 1.2-4.7 3.7 0 5 10.3 2.1 10.3 7.4 0 2.3-2.3 4-5.4 4-2.2 0-4-.8-5.1-2"
        ></path>
      </symbol>
      <symbol id="ico-nav-settings" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"></circle>
        <path
          d="M19.5 13.5l1.2-1.5-1.2-1.5-1.1-.3-.5-1.1.5-1.1-1.4-1.4-1.1.5-1.1-.5-.3-1.1-1.5-1.2-1.5 1.2-.3 1.1-1.1.5-1.1-.5-1.4 1.4.5 1.1-.5 1.1-1.1.3L3.5 12l1.2 1.5 1.1.3.5 1.1-.5 1.1 1.4 1.4 1.1-.5 1.1.5.3 1.1 1.5 1.2 1.5-1.2.3-1.1 1.1-.5 1.1.5 1.4-1.4-.5-1.1.5-1.1z"
        ></path>
      </symbol>
      <symbol id="ico-mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </symbol>
      <symbol id="ico-settings" viewBox="0 0 24 24">
        <path
          d="m9 3-.6 2.4-2 .9L4.2 6 2 10l1.8 1.8v2.4L2 16l2.2 4 2.2-.3 2 .9L9 23h5l.6-2.4 2-.9 2.2.3 2.2-4-1.8-1.8v-2.4L21 10l-2.2-4-2.2.3-2-.9L14 3Z"
          transform="translate(.5 -1) scale(.96)"
        />
        <circle cx="12" cy="12" r="3" />
      </symbol>
      <symbol id="ico-grid" viewBox="0 0 24 24">
        <rect height="7" rx="1" width="7" x="3" y="3"></rect>
        <rect height="7" rx="1" width="7" x="14" y="3"></rect>
        <rect height="7" rx="1" width="7" x="3" y="14"></rect>
        <rect height="7" rx="1" width="7" x="14" y="14"></rect>
      </symbol>
      <symbol id="ico-home" viewBox="0 0 24 24">
        <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"></path>
      </symbol>
      <symbol id="ico-people" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3"></circle>
        <path d="M3.5 19v-1a5.5 5.5 0 0 1 11 0v1"></path>
        <path d="M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5"></path>
      </symbol>
      <symbol id="ico-megaphone" viewBox="0 0 24 24">
        <path d="M4 10h4l11-6v16l-11-6H4zM8 14l2 7h4"></path>
        <path d="M19 8a4 4 0 0 1 0 8"></path>
      </symbol>
      <symbol id="ico-tag" viewBox="0 0 24 24">
        <path d="M3 12V4h8l10 10-8 8z"></path>
        <circle cx="8" cy="8" r="1"></circle>
      </symbol>
      <symbol id="ico-calendar" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="18" x="3" y="5"></rect>
        <path d="M7 3v4m10-4v4M3 10h18"></path>
      </symbol>
      <symbol id="ico-pin" viewBox="0 0 24 24">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"></path>
        <circle cx="12" cy="10" r="2.5"></circle>
      </symbol>
      <symbol id="ico-ticket" viewBox="0 0 24 24">
        <path d="M3 7h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4z"></path>
        <path d="M12 7v2m0 3v1m0 3v3"></path>
      </symbol>
      <symbol id="ico-wallet" viewBox="0 0 24 24">
        <rect height="15" rx="2" width="18" x="3" y="5"></rect>
        <path d="M3 9h18M16 15h2"></path>
      </symbol>
      <symbol id="ico-eye" viewBox="0 0 24 24">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </symbol>
      <symbol id="ico-eye-off" viewBox="0 0 24 24">
        <path d="M3 3l18 18"></path>
        <path
          d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.1 3.8M6.1 6.8C3.7 8.6 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.3-1"
        ></path>
        <path d="M10 10a3 3 0 0 0 4 4"></path>
      </symbol>
      <symbol id="ico-arrow" viewBox="0 0 24 24"><path d="M5 19 19 5M9 5h10v10"></path></symbol>
      <symbol id="ico-edit" viewBox="0 0 24 24">
        <path d="m4 20 5-.8L20 8a2 2 0 0 0-4-4L5 15zM14 6l4 4"></path>
      </symbol>
      <symbol id="ico-external" viewBox="0 0 24 24">
        <path d="M12 5h7v7m0-7-9 9"></path>
        <path d="M19 14v5H5V5h5"></path>
      </symbol>
      <symbol id="ico-bell" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9zM10 21h4"></path>
      </symbol>
      <symbol id="ico-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"></path></symbol>
      <symbol id="ico-chevron" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"></path></symbol>
    </defs>
  </svg>
</template>

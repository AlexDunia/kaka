<template>
  <div class="manage-view active" id="mv-settings">
    <div class="mv-wrap">
      <div class="mv-header">
        <div class="mv-eyebrow" style="color:var(--t-lo)"><svg viewBox="0 0 24 24" style="stroke:var(--t-lo)"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Event settings</div>
        <div class="mv-h1">Event <em style="color:var(--t-mid)">settings.</em></div>
        <div class="mv-p">Control event visibility, notifications, and what happens with this event.</div>
      </div>
      <div class="card">
        <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Visibility</div>
          <div class="toggle-row"><div><div class="toggle-label">Event is public</div><div class="toggle-help">Anyone with the link can find and buy tickets</div></div><div class="toggle on"></div></div>
          <div class="toggle-row"><div><div class="toggle-label">Show on Rush Hour discovery</div><div class="toggle-help">Your event appears in search and browse</div></div><div class="toggle on"></div></div>
          <div class="toggle-row"><div><div class="toggle-label">Show exact attendee count</div><div class="toggle-help">Public can see "612 people going"</div></div><div class="toggle off"></div></div>
        </div>
        <div style="padding:var(--s5) var(--s6)"><div class="sdiv">Notifications</div>
          <div class="toggle-row"><div><div class="toggle-label">Email me every new ticket sale</div><div class="toggle-help">Get an email each time someone buys</div></div><div class="toggle off"></div></div>
          <div class="toggle-row"><div><div class="toggle-label">Daily summary email</div><div class="toggle-help">One email a day with sales numbers</div></div><div class="toggle on"></div></div>
          <div class="toggle-row"><div><div class="toggle-label">Notify when 90% sold out</div><div class="toggle-help">We'll tell you when you're nearly full</div></div><div class="toggle on"></div></div>
        </div>
      </div>
      <div class="danger-zone">
        <div class="danger-head"><div class="danger-head-title">Danger zone</div><div class="danger-head-desc">These actions can't be undone. Be careful.</div></div>
        <div class="danger-row"><div><div class="danger-rname">Pause ticket sales</div><div class="danger-rdesc">Stop new purchases. Current tickets stay valid.</div></div><div class="dbtn outline">Pause sales</div></div>
        <div class="danger-row"><div><div class="danger-rname">Cancel this event</div><div class="danger-rdesc">All buyers get a full refund. This cannot be undone.</div></div><div class="dbtn outline">Cancel event</div></div>
        <div class="danger-row"><div><div class="danger-rname">Delete this event</div><div class="danger-rdesc">Permanently removes the event and all data.</div></div><div class="dbtn fill">Delete event</div></div>
      </div>
    </div>
  </div>
</template>

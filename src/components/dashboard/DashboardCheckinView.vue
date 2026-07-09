<template>
  <div class="manage-view active" id="mv-checkin">
    <div class="mv-wrap">
      <div class="mv-header">
        <div class="mv-eyebrow" style="color:var(--teal)"><svg viewBox="0 0 24 24" style="stroke:var(--teal)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Door check-in</div>
        <div class="mv-h1">Who's <em style="color:var(--teal)">here?</em></div>
        <div class="mv-p">Check in QR tickets at the door, or start by searching a guest name.</div>
      </div>
      <div class="stat-grid-3">
        <div class="scard" style="text-align:center"><div class="scard-label">Checked in</div><div class="scard-val" style="color:var(--teal)">312</div></div>
        <div class="scard" style="text-align:center"><div class="scard-label">Not yet arrived</div><div class="scard-val">300</div></div>
        <div class="scard" style="text-align:center"><div class="scard-label">Check-in rate</div><div class="scard-val">51%</div></div>
      </div>
      <div class="card">
        <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Event QR code</div>
          <div class="qr-zone">
            <div class="qr-frame"><div class="qr-inner"></div></div>
            <div class="qr-cap">Print or display at the entrance. Guests scan it to check in.</div>
            <div class="qr-btns">
              <div class="qr-btn blue"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download QR</div>
              <div class="qr-btn pink"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Print page</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div style="padding:var(--s4) var(--s5);border-bottom:1px solid var(--line-soft)"><div class="search-bar"><svg viewBox="0 0 24 24" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Search by name or ticket number...</span></div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--pink),var(--blue))">AO</div><div class="att-name">Adaeze Okonkwo</div><div class="att-tkt">VIP · #8821</div><div class="ci-badge in">In</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--amber),var(--red))">BM</div><div class="att-name">Biodun Martins</div><div class="att-tkt">General · #8822</div><div class="ci-badge in">In</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--teal),var(--blue))">CA</div><div class="att-name">Chioma Adekunle</div><div class="att-tkt">Early Bird · #8823</div><div class="ci-badge out">Waiting</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,#A78BFA,var(--pink))">DO</div><div class="att-name">Dami Olawale</div><div class="att-tkt">General · #8824</div><div class="ci-badge in">In</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--red),var(--amber))">EI</div><div class="att-name">Emeka Ifeanyi</div><div class="att-tkt">VIP · #8825</div><div class="ci-badge out">Waiting</div></div>
      </div>
    </div>
  </div>
</template>

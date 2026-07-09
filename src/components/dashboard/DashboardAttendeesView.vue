<template>
  <div class="manage-view active" id="mv-attendees">
    <div class="mv-wrap">
      <div class="mv-header">
        <div class="mv-eyebrow" style="color:var(--blue)">
          <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></svg>
          Attendees
        </div>
        <div class="mv-h1">Know your <em style="color:var(--blue)">people.</em></div>
        <div class="mv-p">A simple look at who bought tickets and what they need before event day.</div>
      </div>

      <div class="stat-grid-3">
        <div class="scard" style="text-align:center"><div class="scard-label">Total attendees</div><div class="scard-val">612</div></div>
        <div class="scard" style="text-align:center"><div class="scard-label">VIP guests</div><div class="scard-val" style="color:var(--amber)">38</div></div>
        <div class="scard" style="text-align:center"><div class="scard-label">Need update</div><div class="scard-val" style="color:var(--red)">1</div></div>
      </div>

      <div class="card">
        <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)">
          <div class="chart-head-title">Recent buyers</div>
          <div class="chart-head-sub">Use Door Check-in when it is time to scan tickets.</div>
        </div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--pink),var(--blue))">AO</div><div class="att-name">Adaeze Okonkwo</div><div class="att-tkt">VIP - #8821</div><div class="ci-badge in">Paid</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--amber),var(--red))">BM</div><div class="att-name">Biodun Martins</div><div class="att-tkt">General - #8822</div><div class="ci-badge in">Paid</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--teal),var(--blue))">CA</div><div class="att-name">Chioma Adekunle</div><div class="att-tkt">Early Bird - #8823</div><div class="ci-badge out">Email missing</div></div>
        <div class="att-row"><div class="att-av" style="background:linear-gradient(135deg,var(--red),var(--amber))">EI</div><div class="att-name">Emeka Ifeanyi</div><div class="att-tkt">VIP - #8825</div><div class="ci-badge in">Paid</div></div>
      </div>
    </div>
  </div>
</template>

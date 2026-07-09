<script setup>
const emit = defineEmits(['select-view'])
const showManage = (view) => emit('select-view', view)
</script>

<template>
  <div class="manage-view active" id="mv-overview">
    <div class="sections-wrap overview-wrap">
      <section>
        <article class="overview-pulse-card">
          <div class="section-title">Event pulse</div>
          <h2>Your event is moving. General Admission needs the next push.</h2>
          <p>
            72% sold. VIP and Gold Table are selling fastest, and WhatsApp is bringing in the most buyers.
            Keep the dashboard focused on what is happening, what needs attention, and what to do next.
          </p>
          <div class="decision-line">
            <strong>Best next move:</strong> share the event on WhatsApp today and mention the final VIP spots.
          </div>
        </article>
      </section>

      <section class="overview-insight-grid">
        <article class="overview-health-card">
          <div class="section-title">Event health</div>
          <div class="score-wrap">
            <div class="score-ring"><strong>82</strong></div>
            <div class="score-copy">
              <h3>Strong momentum</h3>
              <p>Sales pace and WhatsApp buyers are carrying the event. General Admission is the one soft spot.</p>
            </div>
          </div>
        </article>

        <article class="overview-actions-panel">
          <div class="overview-card-head compact-head">
            <h3>Do these next</h3>
            <p>The shortest path from the numbers to the organiser's next move.</p>
          </div>
          <div class="smart-action-list">
            <button class="smart-action-row" type="button" @click="showManage('share')">
              <div class="smart-action-icon teal">
                <svg viewBox="0 0 24 24"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
              </div>
              <div class="smart-action-copy">
                <h3>Share on WhatsApp</h3>
                <p>44% of buyers came from here. Keep using what is already working.</p>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>

            <button class="smart-action-row" type="button" @click="showManage('promo')">
              <div class="smart-action-icon amber">
                <svg viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></svg>
              </div>
              <div class="smart-action-copy">
                <h3>Move General Admission</h3>
                <p>323 spots are still open. A short discount can help buyers decide faster.</p>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>

            <button class="smart-action-row" type="button" @click="showManage('email')">
              <div class="smart-action-icon red">
                <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              </div>
              <div class="smart-action-copy">
                <h3>Remind attendees</h3>
                <p>Send one message with arrival time, parking, and what to bring.</p>
              </div>
              <svg class="action-arrow" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </article>
      </section>

      <section class="overview-content-grid">
        <article class="card">
          <div class="overview-card-head">
            <h3>Ticket performance</h3>
            <p>Fast answer: what is selling, what is nearly full, and what needs help.</p>
          </div>
          <div class="tkt-rows compact-ticket-rows">
            <div class="tkt-row">
              <div class="tkt-icon" style="background:var(--teal-bg);border:1px solid var(--teal-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--teal)"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div class="tkt-mid">
                <div class="tkt-name-row">
                  <div class="tkt-name">Early Bird</div>
                  <div class="tkt-sold-tag" style="background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal);">Healthy</div>
                </div>
                <div class="tkt-progress-row">
                  <div class="tkt-prog-track"><div class="tkt-prog-fill fill-teal" style="width:41%"></div></div>
                  <div class="tkt-prog-label">61 sold, 89 left</div>
                </div>
              </div>
              <div class="tkt-right">
                <div class="tkt-price">₦5,000</div>
                <div class="tkt-revenue">₦305,000 earned</div>
              </div>
            </div>

            <div class="tkt-row attention-row">
              <div class="tkt-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>
              </div>
              <div class="tkt-mid">
                <div class="tkt-name-row">
                  <div class="tkt-name">General Admission</div>
                  <div class="tkt-sold-tag" style="background:var(--amber-bg);border:1px solid var(--amber-border);color:var(--amber);">Needs push</div>
                </div>
                <div class="tkt-progress-row">
                  <div class="tkt-prog-track"><div class="tkt-prog-fill fill-blue" style="width:35%"></div></div>
                  <div class="tkt-prog-label">177 sold, 323 left</div>
                </div>
              </div>
              <div class="tkt-right">
                <div class="tkt-price">₦10,000</div>
                <div class="tkt-revenue">₦1,770,000 earned</div>
              </div>
            </div>

            <div class="tkt-row">
              <div class="tkt-icon" style="background:var(--amber-bg);border:1px solid var(--amber-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--amber)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
              <div class="tkt-mid">
                <div class="tkt-name-row">
                  <div class="tkt-name">VIP</div>
                  <div class="tkt-sold-tag" style="background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal);">Selling fast</div>
                </div>
                <div class="tkt-progress-row">
                  <div class="tkt-prog-track"><div class="tkt-prog-fill fill-amber" style="width:76%"></div></div>
                  <div class="tkt-prog-label">Only 12 left</div>
                </div>
              </div>
              <div class="tkt-right">
                <div class="tkt-price">₦30,000</div>
                <div class="tkt-revenue">₦1,140,000 earned</div>
              </div>
            </div>

            <div class="tkt-row">
              <div class="tkt-icon" style="background:var(--red-bg);border:1px solid var(--red-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--red)"><path d="M3 7h18M5 7l1 12h12l1-12" /></svg>
              </div>
              <div class="tkt-mid">
                <div class="tkt-name-row">
                  <div class="tkt-name">Gold Table</div>
                  <div class="tkt-sold-tag" style="background:var(--red-bg);border:1px solid var(--red-border);color:var(--red);">Almost full</div>
                </div>
                <div class="tkt-progress-row">
                  <div class="tkt-prog-track"><div class="tkt-prog-fill fill-red" style="width:93%"></div></div>
                  <div class="tkt-prog-label" style="color:var(--red);font-weight:800;">Only 5 tables left</div>
                </div>
              </div>
              <div class="tkt-right">
                <div class="tkt-price">₦250,000</div>
                <div class="tkt-revenue">₦4,200,000 earned</div>
              </div>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="overview-card-head">
            <h3>Top buyer channels</h3>
            <p>These are purchases by source, so the traffic detail is not repeated elsewhere.</p>
          </div>
          <div class="traffic-rows overview-traffic">
            <div class="traffic-row">
              <div class="traffic-icon" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.22);">
                <svg viewBox="0 0 24 24" style="stroke:#25d366"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.2 2.2L16.5 8" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">WhatsApp</div>
                <div class="traffic-count">271 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-teal" style="width:44%"></div></div></div>
              </div>
              <div class="traffic-pct">44%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">Direct link</div>
                <div class="traffic-count">148 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-blue" style="width:24%"></div></div></div>
              </div>
              <div class="traffic-pct">24%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.22);">
                <svg viewBox="0 0 24 24" style="stroke:var(--red)"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">Instagram</div>
                <div class="traffic-count">110 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-red" style="width:18%"></div></div></div>
              </div>
              <div class="traffic-pct">18%</div>
            </div>
          </div>
          <div class="overview-note">
            Full sharing links, platform posts, and source setup stay inside Promote.
          </div>
        </article>
      </section>

      <section>
        <div class="section-title">Sales trend</div>
        <div class="card">
          <div class="chart-wrap">
            <div class="chart-head">
              <div>
                <div class="chart-head-title">Tickets bought per day</div>
                <div class="chart-head-sub">Last 30 days</div>
              </div>
              <div class="chart-pills">
                <div class="cpill">7d</div>
                <div class="cpill on">30d</div>
                <div class="cpill">All</div>
              </div>
            </div>
            <svg class="chart-svg" viewBox="0 0 580 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,.05)" stroke-width="1" />
              <line x1="0" y1="80" x2="580" y2="80" stroke="rgba(255,255,255,.05)" stroke-width="1" />
              <line x1="0" y1="50" x2="580" y2="50" stroke="rgba(255,255,255,.05)" stroke-width="1" />
              <defs>
                <linearGradient id="overviewSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#29B89A" stop-opacity=".22" />
                  <stop offset="100%" stop-color="#29B89A" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z" fill="url(#overviewSalesGradient)" />
              <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12" stroke="#29B89A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="535" cy="16" r="4" fill="#29B89A" />
            </svg>
            <p class="chart-summary-copy">
              Sales are up this week. Keep the momentum going while premium spots still feel scarce.
            </p>
          </div>
        </div>
      </section>

      <section class="mini-metric-grid">
        <article class="mini-metric-card">
          <div class="stat-cell-label">Average spend per buyer</div>
          <div class="mini-metric-value">₦12,100</div>
        </article>
        <article class="mini-metric-card">
          <div class="stat-cell-label">Best sales day</div>
          <div class="mini-metric-value">Friday</div>
        </article>
        <article class="mini-metric-card">
          <div class="stat-cell-label">Peak buying time</div>
          <div class="mini-metric-value">7-11 PM</div>
        </article>
      </section>

      <section>
        <article class="event-readiness-card">
          <div>
            <h3>Event-day readiness</h3>
            <p>QR code ready. 612 expected. Check-in hasn't started.</p>
          </div>
          <button class="btn btn-ghost" type="button" @click="showManage('checkin')">Prepare check-in</button>
        </article>
      </section>
    </div>
  </div>
</template>

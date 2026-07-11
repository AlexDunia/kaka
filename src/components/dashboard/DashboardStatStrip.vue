<template>
  <div class="stat-strip" aria-label="Event performance metrics">
    <article class="stat-cell stat-cell--tickets">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">Tickets sold</div>
          <div class="stat-cell-value">612</div>
          <div class="stat-cell-sub up">
            <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
            +18% this week
          </div>
        </div>
        <div class="stat-icon-badge stat-icon-badge--pink" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 8.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" /><path d="M9 7.5v9" /></svg>
        </div>
      </div>
      <div class="stat-support stat-support--progress">
        <div class="stat-prog-copy">
          <span>612 of 850</span><span>72% sold</span>
        </div>
        <div class="stat-prog-track"><div class="stat-prog-fill fill-pink" style="width: 72%"></div></div>
      </div>
    </article>

    <article class="stat-cell stat-cell--revenue">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">Revenue</div>
          <div class="stat-cell-value">&#8358;7.4M</div>
          <div class="stat-cell-sub up">
            <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
            +&#8358;1.2M this week
          </div>
        </div>
        <div class="stat-icon-badge stat-icon-badge--green" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3v18" /><path d="M17 7H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H6" /></svg>
        </div>
      </div>
      <svg class="stat-sparkline stat-support" viewBox="0 0 180 36" aria-hidden="true">
        <path d="M3 27 L26 24 L48 26 L70 19 L92 21 L114 14 L136 16 L158 9 L177 7" />
      </svg>
    </article>

    <article class="stat-cell stat-cell--spots">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">Spots left</div>
          <div class="stat-cell-value">238</div>
          <div class="stat-cell-sub neutral">of 850 total</div>
        </div>
        <div class="stat-icon-badge stat-icon-badge--muted" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2.2a3.2 3.2 0 0 0-2.4-3.1" /><path d="M17 3.3a3.8 3.8 0 0 1 0 7.4" /></svg>
        </div>
      </div>
      <div class="stat-availability stat-support" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span><span class="pressure"></span><span class="pressure"></span>
      </div>
    </article>

    <article class="stat-cell stat-cell--views">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">Page views</div>
          <div class="stat-cell-value">4,821</div>
          <div class="stat-cell-sub neutral">3.2% bought a ticket</div>
        </div>
        <div class="stat-icon-badge stat-icon-badge--muted" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="3" /></svg>
        </div>
      </div>
      <div class="stat-bars stat-support" aria-hidden="true">
        <span style="height: 38%"></span><span style="height: 58%"></span><span style="height: 46%"></span><span style="height: 72%"></span><span style="height: 54%"></span><span style="height: 82%"></span><span style="height: 68%"></span>
      </div>
    </article>
  </div>
</template>
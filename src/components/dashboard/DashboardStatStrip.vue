<template>
  <div class="stat-strip">
    <div class="stat-cell">
      <div class="stat-cell-label">Tickets sold</div>
      <div class="stat-cell-value">612</div>
      <div class="stat-cell-sub up">
        <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
        +18% this week
      </div>
      <div class="stat-prog">
        <div
          style="
            display: flex;
            justify-content: space-between;
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--t-lo);
            margin-bottom: 5px;
          "
        >
          <span>612 of 850</span><span>72%</span>
        </div>
        <div class="stat-prog-track"><div class="stat-prog-fill fill-teal" style="width: 72%"></div></div>
      </div>
    </div>
    <div class="stat-cell">
      <div class="stat-cell-label">Revenue</div>
      <div class="stat-cell-value" style="font-size: 1.55rem">₦7.4M</div>
      <div class="stat-cell-sub up">
        <svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" /></svg>
        ₦1.2M this week
      </div>
    </div>
    <div class="stat-cell">
      <div class="stat-cell-label">Spots left</div>
      <div class="stat-cell-value">238</div>
      <div class="stat-cell-sub neutral">out of 850 total</div>
    </div>
    <div class="stat-cell">
      <div class="stat-cell-label">Page views</div>
      <div class="stat-cell-value">4,821</div>
      <div class="stat-cell-sub neutral">3.2% buy a ticket</div>
    </div>
  </div>
</template>

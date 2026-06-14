<script setup>
const emit = defineEmits(['select-view'])
const showManage = (view) => emit('select-view', view)
</script>

<template>
  <div class="manage-view active" id="mv-overview">
                <div class="sections-wrap">
    
                  <!-- Quick actions -->
                  <div>
                    <div class="section-title">Quick actions</div>
                    <div class="quick-actions">
                      <div class="qa-btn" @click="showManage('checkin')">
                        <div class="qa-icon" style="background:var(--teal-bg);border:1px solid var(--teal-border);">
                          <svg viewBox="0 0 24 24" style="stroke:var(--teal)"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div class="qa-label">Check-in</div>
                        <div class="qa-desc">Scan tickets at the door</div>
                      </div>
                      <div class="qa-btn" @click="showManage('email')">
                        <div class="qa-icon" style="background:var(--red-bg);border:1px solid var(--red-border);">
                          <svg viewBox="0 0 24 24" style="stroke:var(--red)"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </div>
                        <div class="qa-label">Email attendees</div>
                        <div class="qa-desc">Send a message to everyone</div>
                      </div>
                      <div class="qa-btn" @click="showManage('share')">
                        <div class="qa-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                          <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        </div>
                        <div class="qa-label">Share event</div>
                        <div class="qa-desc">Get your link out there</div>
                      </div>
                      <div class="qa-btn" @click="showManage('payout')">
                        <div class="qa-icon" style="background:var(--amber-bg);border:1px solid var(--amber-border);">
                          <svg viewBox="0 0 24 24" style="stroke:var(--amber)"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        </div>
                        <div class="qa-label">Payouts</div>
                        <div class="qa-desc">₦7.4M ready to withdraw</div>
                      </div>
                    </div>
                  </div>
    
                  <!-- Sales chart -->
                  <div>
                    <div class="section-title">Ticket sales over time</div>
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
                          <line x1="0" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                          <line x1="0" y1="80" x2="580" y2="80" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                          <line x1="0" y1="50" x2="580" y2="50" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                          <line x1="0" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
                          <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stop-color="#29B89A" stop-opacity=".22"/>
                              <stop offset="100%" stop-color="#29B89A" stop-opacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z" fill="url(#cg)"/>
                          <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12" stroke="#29B89A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="535" cy="16" r="4" fill="#29B89A"/>
                          <circle cx="535" cy="16" r="8" fill="rgba(41,184,154,.18)"/>
                        </svg>
                      </div>
                    </div>
                  </div>
    
                  <!-- ─────────────────────────────────
                       TICKET BREAKDOWN — REDESIGNED
                       No table. Card rows. Clear hierarchy.
                       Icon per tier, plain labels, no dimmed text tricks.
                  ──────────────────────────────────── -->
                  <div>
                    <div class="section-title">Tickets by category</div>
                    <div class="card">
                      <div class="tkt-rows">
    
                        <!-- Early Bird -->
                        <div class="tkt-row">
                          <div class="tkt-icon" style="background:var(--teal-bg);border:1px solid var(--teal-border);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--teal)">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke-width="1.5"/>
                              <path d="M8 12l3 3 5-5" stroke-width="2"/>
                            </svg>
                          </div>
                          <div class="tkt-mid">
                            <div class="tkt-name-row">
                              <div class="tkt-name">Early Bird</div>
                              <div class="tkt-sold-tag" style="background:var(--teal-bg);border:1px solid var(--teal-border);color:var(--teal);">61 sold</div>
                            </div>
                            <div class="tkt-progress-row">
                              <div class="tkt-prog-track">
                                <div class="tkt-prog-fill fill-teal" style="width:41%"></div>
                              </div>
                              <div class="tkt-prog-label">89 spots left of 150</div>
                            </div>
                          </div>
                          <div class="tkt-right">
                            <div class="tkt-price">₦5,000</div>
                            <div class="tkt-revenue">₦305,000 earned</div>
                          </div>
                        </div>
    
                        <!-- General Admission -->
                        <div class="tkt-row">
                          <div class="tkt-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--blue)">
                              <rect x="2" y="7" width="20" height="14" rx="2" stroke-width="1.8"/>
                              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke-width="1.8"/>
                              <line x1="12" y1="12" x2="12" y2="16" stroke-width="2"/>
                              <line x1="10" y1="14" x2="14" y2="14" stroke-width="2"/>
                            </svg>
                          </div>
                          <div class="tkt-mid">
                            <div class="tkt-name-row">
                              <div class="tkt-name">General Admission</div>
                              <div class="tkt-sold-tag" style="background:var(--blue-bg);border:1px solid var(--blue-border);color:var(--blue);">177 sold</div>
                            </div>
                            <div class="tkt-progress-row">
                              <div class="tkt-prog-track">
                                <div class="tkt-prog-fill fill-blue" style="width:35%"></div>
                              </div>
                              <div class="tkt-prog-label">323 spots left of 500</div>
                            </div>
                          </div>
                          <div class="tkt-right">
                            <div class="tkt-price">₦10,000</div>
                            <div class="tkt-revenue">₦1,770,000 earned</div>
                          </div>
                        </div>
    
                        <!-- VIP -->
                        <div class="tkt-row">
                          <div class="tkt-icon" style="background:var(--amber-bg);border:1px solid var(--amber-border);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--amber)">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke-width="1.8"/>
                            </svg>
                          </div>
                          <div class="tkt-mid">
                            <div class="tkt-name-row">
                              <div class="tkt-name">VIP</div>
                              <div class="tkt-sold-tag" style="background:var(--amber-bg);border:1px solid var(--amber-border);color:var(--amber);">38 sold</div>
                            </div>
                            <div class="tkt-progress-row">
                              <div class="tkt-prog-track">
                                <div class="tkt-prog-fill fill-amber" style="width:76%"></div>
                              </div>
                              <div class="tkt-prog-label">12 spots left of 50</div>
                            </div>
                          </div>
                          <div class="tkt-right">
                            <div class="tkt-price">₦30,000</div>
                            <div class="tkt-revenue">₦1,140,000 earned</div>
                          </div>
                        </div>
    
                        <!-- Gold Table -->
                        <div class="tkt-row">
                          <div class="tkt-icon" style="background:var(--red-bg);border:1px solid var(--red-border);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--red)">
                              <path d="M3 7h18M5 7l1 12h12l1-12M10 11v5M14 11v5M9 7V4h6v3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          <div class="tkt-mid">
                            <div class="tkt-name-row">
                              <div class="tkt-name">Gold Table</div>
                              <div class="tkt-sold-tag" style="background:var(--red-bg);border:1px solid var(--red-border);color:var(--red);">336 sold · almost full</div>
                            </div>
                            <div class="tkt-progress-row">
                              <div class="tkt-prog-track">
                                <div class="tkt-prog-fill fill-red" style="width:93%"></div>
                              </div>
                              <div class="tkt-prog-label" style="color:var(--red);font-weight:800;">Only 5 spots left</div>
                            </div>
                          </div>
                          <div class="tkt-right">
                            <div class="tkt-price">₦250,000</div>
                            <div class="tkt-revenue">₦4,200,000 earned</div>
                          </div>
                        </div>
    
                      </div>
                    </div>
                  </div>
    
                  <!-- ─────────────────────────────────
                       TRAFFIC SOURCES — REDESIGNED
                       Proper SVG icons. No emojis.
                  ──────────────────────────────────── -->
                  <div>
                    <div class="section-title">Where buyers came from</div>
                    <div class="card">
                      <div class="traffic-rows">
    
                        <!-- WhatsApp -->
                        <div class="traffic-row">
                          <div class="traffic-icon" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.22);">
                            <svg viewBox="0 0 24 24" style="stroke:none;fill:#25d366;">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.301A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fill="none" stroke="#25d366" stroke-width="1.8"/>
                            </svg>
                          </div>
                          <div class="traffic-info">
                            <div class="traffic-name">WhatsApp</div>
                            <div class="traffic-count">271 buyers</div>
                          </div>
                          <div class="traffic-bar-wrap">
                            <div class="traffic-bar-track">
                              <div class="traffic-bar-fill fill-teal" style="width:44%"></div>
                            </div>
                          </div>
                          <div class="traffic-pct">44%</div>
                        </div>
    
                        <!-- Direct link -->
                        <div class="traffic-row">
                          <div class="traffic-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--blue)">
                              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke-width="1.8" stroke-linecap="round"/>
                              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                          </div>
                          <div class="traffic-info">
                            <div class="traffic-name">Direct link</div>
                            <div class="traffic-count">148 buyers</div>
                          </div>
                          <div class="traffic-bar-wrap">
                            <div class="traffic-bar-track">
                              <div class="traffic-bar-fill fill-blue" style="width:24%"></div>
                            </div>
                          </div>
                          <div class="traffic-pct">24%</div>
                        </div>
    
                        <!-- Instagram -->
                        <div class="traffic-row">
                          <div class="traffic-icon" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.22);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--red)">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke-width="1.8"/>
                              <circle cx="12" cy="12" r="4" stroke-width="1.8"/>
                              <circle cx="17.5" cy="6.5" r="1" fill="var(--red)" stroke="none"/>
                            </svg>
                          </div>
                          <div class="traffic-info">
                            <div class="traffic-name">Instagram</div>
                            <div class="traffic-count">110 buyers</div>
                          </div>
                          <div class="traffic-bar-wrap">
                            <div class="traffic-bar-track">
                              <div class="traffic-bar-fill fill-red" style="width:18%"></div>
                            </div>
                          </div>
                          <div class="traffic-pct">18%</div>
                        </div>
    
                        <!-- X / Twitter -->
                        <div class="traffic-row">
                          <div class="traffic-icon" style="background:rgba(255,255,255,.06);border:1px solid var(--line-mid);">
                            <svg viewBox="0 0 24 24" style="fill:var(--t-mid);stroke:none;">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </div>
                          <div class="traffic-info">
                            <div class="traffic-name">X / Twitter</div>
                            <div class="traffic-count">55 buyers</div>
                          </div>
                          <div class="traffic-bar-wrap">
                            <div class="traffic-bar-track">
                              <div class="traffic-bar-fill" style="width:9%;background:var(--t-lo)"></div>
                            </div>
                          </div>
                          <div class="traffic-pct">9%</div>
                        </div>
    
                        <!-- Other -->
                        <div class="traffic-row">
                          <div class="traffic-icon" style="background:rgba(255,255,255,.04);border:1px solid var(--line);">
                            <svg viewBox="0 0 24 24" style="stroke:var(--t-lo)">
                              <circle cx="12" cy="12" r="10" stroke-width="1.8"/>
                              <line x1="2" y1="12" x2="22" y2="12" stroke-width="1.8"/>
                              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke-width="1.8"/>
                            </svg>
                          </div>
                          <div class="traffic-info">
                            <div class="traffic-name">Other</div>
                            <div class="traffic-count">28 buyers</div>
                          </div>
                          <div class="traffic-bar-wrap">
                            <div class="traffic-bar-track">
                              <div class="traffic-bar-fill" style="width:5%;background:var(--t-xlo)"></div>
                            </div>
                          </div>
                          <div class="traffic-pct" style="color:var(--t-lo);">5%</div>
                        </div>
    
                      </div>
                    </div>
                  </div>
    
                </div>
              </div><!-- /mv-overview -->
    
              <!-- INSIGHTS -->
</template>

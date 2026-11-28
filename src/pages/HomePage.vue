<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, inject, onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useLandingMotion } from '@/composables/useLandingMotion'
defineProps({ sectionOnly: String })
const root = ref(null)
const publicPageLoading = inject('publicPageLoading', ref(false))
const heroReady = computed(() => !publicPageLoading.value)
const heroCaption = ['Concerts,', 'meetups,', 'pop-ups and culture,', 'all in one place.']
const { replay } = useLandingMotion(root)
const campaignHeading = ref(null)
const campaignArmed = ref(false)
const campaignPlaying = ref(false)
let campaignObserver
onMounted(() => {
  if (!campaignHeading.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  campaignArmed.value = true
  campaignObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) campaignPlaying.value = false
      else if (entry.intersectionRatio >= 0.35) campaignPlaying.value = true
    },
    { threshold: [0, 0.35], rootMargin: '-130px 0px -5% 0px' },
  )
  campaignObserver.observe(campaignHeading.value)
})
onBeforeUnmount(() => campaignObserver?.disconnect())
const asset = (path) => `${import.meta.env.BASE_URL}${path}`
</script>
<template>
  <main id="top" ref="root">
    <section
      v-if="!sectionOnly"
      class="hero hero--campaign"
      :class="{ 'hero--campaign-ready': heroReady }"
      aria-labelledby="hero-title"
    >
      <div class="container hero-grid">
        <div class="hero-copy">
          <h1 id="hero-title" aria-label="Find events worth showing up for.">
            <span class="hero-title-opening" aria-hidden="true"
              ><span class="hero-bounce-word" style="--beat: 0">Find events</span>
              <span class="hero-bounce-word" style="--beat: 1">worth</span></span
            >
            {{ ' '
            }}<span class="hero-title-accent" aria-hidden="true"
              ><span class="hero-bounce-word" style="--beat: 2">showing up</span>
              <span class="hero-bounce-word" style="--beat: 3">for.</span></span
            >
          </h1>
          <p class="hero-lede">
            <template v-for="(phrase, index) in heroCaption" :key="phrase"
              ><span class="hero-caption-beat" :style="{ '--beat': index }">{{
                phrase
              }}</span
              >{{ index < heroCaption.length - 1 ? ' ' : '' }}</template
            >
          </p>
          <div class="hero-actions">
            <RouterLink class="btn btn-primary" to="/find-events">Find events</RouterLink>
            <RouterLink class="btn hero-create-event" to="/create-event">Create event</RouterLink>
          </div>
        </div>
      </div>
      <figure class="rh-photo-hero" aria-label="Lagos waterfront eventgoers">
        <img
          src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1795450760/Waterfront_City_Stroll_with_Hybrid_Car_1_qsrb26.png"
          alt="Two friends dressed for an outing overlooking the Lagos waterfront, with a palm tree, parked white car and Lekki-Ikoyi bridge in the background"
          width="1570"
          height="1002"
          decoding="async"
          fetchpriority="high"
        />
      </figure>
    </section>

    <section
      v-if="sectionOnly !== 'moments'"
      aria-labelledby="organizers-title"
      class="organizers"
      id="organizers"
    >
      <div class="container">
        <div
          class="organizer-top campaign-intro"
          :class="{
            'campaign-intro--armed': campaignArmed,
            'campaign-intro--playing': campaignPlaying,
          }"
        >
          <div class="organizer-copy">
            <h2
              ref="campaignHeading"
              id="organizers-title"
              class="campaign-heading"
              :class="{
                'campaign-heading--armed': campaignArmed,
                'campaign-heading--playing': campaignPlaying,
              }"
            >
              <span class="campaign-phrase campaign-phrase--first">Everything</span
              ><span class="campaign-phrase campaign-phrase--second"
                >you need to run your event.</span
              >
            </h2>
            <p>Share it, manage your guests and see your sales in one place.</p>
          </div>
          <svg class="campaign-down-arrow" viewBox="0 0 64 144" fill="none" aria-hidden="true">
            <path
              d="M32 2V139M12 119L32 139L52 119"
              pathLength="1"
              stroke="currentColor"
              stroke-width="1"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div class="feature-stories">
          <article class="story-row" data-feature="promote">
            <div class="story-copy">
              <span class="story-step">Promotion</span>
              <h3>Share your event. See what works.</h3>
              <p>Track ticket sales from Instagram, WhatsApp and your other sharing links.</p>
              <RouterLink class="text-link" to="/dashboard?view=share"
                >Explore promotion <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg
              ></RouterLink>
            </div>
            <div class="story-stage stage-promo">
              <div
                aria-label="Animated illustration: sharing links across platforms results in tracked sales"
                class="demo-board promo-board"
              >
                <div class="demo-topline">
                  <span class="demo-led"></span><strong>Social links</strong
                  ><span class="demo-mini-note">Sample</span>
                </div>
                <div class="demo-promobox">
                  <span class="demo-success-mark"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span><span>Sharing links</span
                  ><span class="demo-tiny-check">3 channels</span>
                </div>
                <div class="demo-channel">
                  <span class="channel-icon ig">◎</span><span class="channel-label">Instagram</span
                  ><span class="demo-short-link">rushhour.ng/ig</span
                  ><span class="demo-copy-icon">⧉</span>
                </div>
                <div class="demo-channel">
                  <span class="channel-icon wa">◉</span><span class="channel-label">WhatsApp</span
                  ><span class="demo-short-link">rushhour.ng/wa</span
                  ><span class="demo-copy-icon">⧉</span>
                </div>
                <div class="demo-channel">
                  <span class="channel-icon xx">𝕏</span><span class="channel-label">X</span
                  ><span class="demo-short-link">rushhour.ng/x</span
                  ><span class="demo-copy-icon">⧉</span>
                </div>
                <div class="promo-conversion">
                  <span class="conversion-dot"></span>
                  <div><b>New ticket sale</b><small>From Instagram · General admission</small></div>
                  <span class="conversion-check"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span>
                </div>
              </div>
              <button
                aria-label="Replay promotion illustration"
                class="demo-replay"
                @click="replay"
                data-replay="promote"
                type="button"
              >
                <svg class="icon"><use href="#i-arrow"></use></svg> Replay
              </button>
            </div>
          </article>
          <article class="story-row" data-feature="sales">
            <div class="story-copy">
              <span class="story-step">Overview</span>
              <h3>Know how your event is selling.</h3>
              <p>See tickets sold, money earned and what’s still available.</p>
              <RouterLink class="text-link" to="/dashboard?view=overview"
                >Explore overview <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg
              ></RouterLink>
            </div>
            <div class="story-stage stage-sales">
              <div
                aria-label="Animated illustration: event sales chart updates with new purchases"
                class="demo-board sales-board"
              >
                <div class="demo-topline">
                  <span class="demo-led"></span><strong>Event overview</strong
                  ><span class="demo-mini-note">Sample</span>
                </div>
                <div class="sales-metrics">
                  <div>
                    <span>Tickets sold</span
                    ><strong
                      ><span aria-hidden="true" class="sales-counter">412</span
                      ><span class="sales-total"> / 700</span></strong
                    >
                  </div>
                  <div class="sales-rise">
                    <span class="sale-arrow">↗</span><span>Sales growing</span>
                  </div>
                </div>
                <div class="sales-progress"><span class="sales-progress-fill"></span></div>
                <svg
                  aria-hidden="true"
                  class="sales-chart"
                  preserveAspectRatio="none"
                  viewBox="0 0 400 117"
                >
                  <path class="chart-gridline" d="M0 29H400M0 68H400M0 106H400"></path>
                  <path
                    class="chart-fill"
                    d="M0 100L44 93L88 96L129 78L170 81L215 63L256 67L303 38L352 39L400 13V117H0Z"
                  ></path>
                  <path
                    class="chart-line"
                    d="M0 100L44 93L88 96L129 78L170 81L215 63L256 67L303 38L352 39L400 13"
                  ></path>
                </svg>
                <div class="sales-footer">
                  <span>Sales at a glance</span><span class="sales-live-dot"></span
                  ><span>Updated just now</span>
                </div>
                <div class="sales-notice">+1 ticket sold <span>General admission</span></div>
              </div>
              <button
                aria-label="Replay event overview illustration"
                class="demo-replay"
                @click="replay"
                data-replay="sales"
                type="button"
              >
                <svg class="icon"><use href="#i-arrow"></use></svg> Replay
              </button>
            </div>
          </article>
          <article class="story-row" data-feature="attendees">
            <div class="story-copy">
              <span class="story-step">Attendees</span>
              <h3>Know who’s coming.</h3>
              <p>Find your buyers, see their tickets and manage your guest list.</p>
              <RouterLink class="text-link" to="/dashboard?view=attendees"
                >Explore attendees <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg
              ></RouterLink>
            </div>
            <div class="story-stage stage-attendees">
              <div
                aria-label="Animated illustration: a buyer's purchase expands to show three tickets and guest status"
                class="demo-board attendees-board"
              >
                <div class="demo-topline">
                  <span class="demo-led"></span><strong>Attendees</strong
                  ><span class="demo-mini-note">Sample</span>
                </div>
                <div class="attendee-search">
                  <svg class="icon"><use href="#i-search"></use></svg>Search people or tickets
                </div>
                <div class="buyer-summary">
                  <span class="buyer-initials">DA</span
                  ><span><strong>Damilola A.</strong><small>Bought 3 tickets</small></span
                  ><span class="buyer-chevron">⌄</span>
                </div>
                <div class="buyer-tickets">
                  <div>
                    <span class="ticket-tick ticket-one"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span><span>Ticket 01</span
                    ><strong>Confirmed</strong>
                  </div>
                  <div>
                    <span class="ticket-tick ticket-two"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span><span>Ticket 02</span
                    ><strong>Confirmed</strong>
                  </div>
                  <div>
                    <span class="ticket-tick ticket-three"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span><span>Ticket 03</span
                    ><strong>Confirmed</strong>
                  </div>
                </div>
                <div class="buyer-total"><span>1 buyer</span><span>3 tickets</span></div>
              </div>
              <button
                aria-label="Replay attendee grouping illustration"
                class="demo-replay"
                @click="replay"
                data-replay="attendees"
                type="button"
              >
                <svg class="icon"><use href="#i-arrow"></use></svg> Replay
              </button>
            </div>
          </article>
          <article class="story-row" data-feature="checkin">
            <div class="story-copy">
              <span class="story-step">Door check-in</span>
              <h3>Check guests in with less hassle.</h3>
              <p>Scan tickets, confirm entry and keep track of arrivals.</p>
              <RouterLink class="text-link" to="/dashboard?view=checkin"
                >Explore door check-in <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg
              ></RouterLink>
            </div>
            <div class="story-stage stage-checkin">
              <div
                aria-label="Animated illustration: ticket QR code is scanned and guest entry is confirmed"
                class="demo-board checkin-board"
              >
                <div class="demo-topline">
                  <span class="demo-led"></span><strong>Door check-in</strong
                  ><span class="demo-mini-note">Sample</span>
                </div>
                <div class="checkin-content">
                  <div class="qr-scanner">
                    <svg aria-hidden="true" class="demo-qr" viewBox="0 0 120 120">
                      <rect fill="#fff" height="120" rx="4" width="120" x="0" y="0"></rect>
                      <g fill="#2f3943">
                        <path
                          d="M8 8h34v34H8Zm7 7v20h20V15Zm10 6h5v8h-5ZM77 8h34v34H77Zm7 7v20h20V15Zm10 6h5v8h-5ZM8 77h34v34H8Zm7 7v20h20V84Zm10 6h5v8h-5Z"
                          fill-rule="evenodd"
                        ></path>
                        <path
                          d="M52 9h8v10h-8zm10 0h10v8H62zM48 26h12v8H48zm17 5h9v12h-9zM50 48h11v12H50zm16 4h11v9H66zm17-4h10v13H83zm13 15h15v10H96zM52 65h15v10H52zm16 13h8v9h-8zm12 0h12v9H80zm14 12h17v9H94zm-45 2h13v9H49zm15 11h20v8H64zm20-8h8v16h-8z"
                        ></path>
                      </g></svg
                    ><span class="scan-line"></span><span class="scan-corner a"></span
                    ><span class="scan-corner b"></span><span class="scan-corner c"></span
                    ><span class="scan-corner d"></span>
                  </div>
                  <div class="checkin-detail">
                    <span class="checkin-status-wait">Scanning ticket...</span
                    ><span class="checkin-status-ok">✓ Checked in</span><strong>Damilola A.</strong
                    ><small>General admission</small
                    ><span class="checkin-count">Entry recorded</span>
                  </div>
                </div>
                <div class="checkin-footer">
                  <span class="arrival-dot"></span>Entry history
                  <span class="checkin-clock">12:24 PM</span>
                </div>
              </div>
              <button
                aria-label="Replay door check-in illustration"
                class="demo-replay"
                @click="replay"
                data-replay="checkin"
                type="button"
              >
                <svg class="icon"><use href="#i-arrow"></use></svg> Replay
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section
      v-if="sectionOnly !== 'features'"
      aria-labelledby="moments-title"
      class="event-decision"
      id="moments"
    >
      <img
        class="event-decision-photo"
        :src="asset('images/public/849b60955b7e6b.png')"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <div class="container event-decision-content">
        <h2 id="moments-title">Every kind of event lives on <span>rushhourticket.</span></h2>
        <p>Find your next plan, or bring people together at an event of your own.</p>
        <div class="event-decision-actions">
          <RouterLink class="btn btn-primary" to="/find-events"
            >Find events <svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg
          ></RouterLink>
          <RouterLink class="btn event-decision-create" to="/create-event"
            >Create event <svg class="icon" aria-hidden="true"><use href="#i-arrow" /></svg
          ></RouterLink>
        </div>
      </div>
    </section>
    <section v-else aria-labelledby="start-title" class="start-section" id="start">
      <div class="container start-inner">
        <h2 id="start-title">Have an event in mind?</h2>
        <p>Set it up, share it and start selling tickets.</p>
        <RouterLink class="btn btn-primary start-button" to="/create-event"
          >Create event <svg aria-hidden="true" class="icon"><use href="#i-arrow" /></svg
        ></RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hero-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--ds-space-12);
  margin-top: var(--ds-space-32);
}
.hero-actions .btn {
  min-width: 148px;
  min-height: 48px;
  padding: var(--ds-space-12) var(--ds-space-24);
  border-radius: var(--ds-radius-control);
}
.hero-actions .hero-create-event {
  border: 1px solid var(--ds-color-border-control);
  background: transparent;
  color: var(--ds-color-text);
}
.hero-actions .hero-create-event:hover {
  border-color: var(--ds-color-text);
  background: var(--ds-color-surface-subtle);
}
@media (max-width: 390px) {
  .hero-actions {
    width: 100%;
    flex-direction: column;
  }
  .hero-actions .btn {
    width: 100%;
  }
}
</style>

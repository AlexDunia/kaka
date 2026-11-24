<script setup>
import PublicEventSearch from './PublicEventSearch.vue'
const asset = (path) => `${import.meta.env.BASE_URL}${path}`
</script><template><section class="hero rh-discovery-hero" aria-labelledby="hero-title">
  <div class="container hero-grid">
    <div class="hero-copy">
      <h1 id="hero-title">Find your kind of <span>event.</span></h1>
      <p class="hero-lede">Good music, great people and plans worth stepping out for.</p>
      <PublicEventSearch :discovery="true" />
    </div>
  </div>
  <figure class="rh-discovery-photo" aria-label="People enjoying live music, game nights and food events">
    <img :src="asset('images/public/821e588b91a7e6.png')" alt="People enjoying a concert, playing games together and sharing food at social events" fetchpriority="high" decoding="async"/>
  </figure>
</section></template>

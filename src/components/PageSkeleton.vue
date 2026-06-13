<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      [
        'default',
        'grid',
        'detail',
        'dashboard',
        'form',
        'auth',
        'contact',
        'cart',
        'blog',
        'not-found',
        'create-event',
      ].includes(value),
  },
  rows: {
    type: Number,
    default: 4,
  },
  cards: {
    type: Number,
    default: 6,
  },
})

const cardCount = computed(() => Math.max(1, props.cards))
const rowCount = computed(() => Math.max(1, props.rows))
</script>

<template>
  <section
    v-if="variant === 'create-event'"
    class="create-event-page create-event-skeleton"
    aria-hidden="true"
  >
    <header class="ce-header">
      <div class="skeleton-block ce-logo"></div>
      <div class="skeleton-block ce-header-back"></div>
      <nav class="ce-progress">
        <div v-for="step in 4" :key="`ce-step-${step}`" class="ce-step">
          <span class="skeleton-block ce-step-number"></span>
          <span class="skeleton-block ce-step-label"></span>
        </div>
      </nav>
      <div class="ce-header-actions">
        <div class="skeleton-block theme-btn"></div>
        <div class="skeleton-block draft-badge"></div>
        <div class="skeleton-block ghost-btn"></div>
      </div>
    </header>

    <div class="create-event-skeleton__body">
      <div class="create-event-skeleton__preview-toggle">
        <div class="skeleton-block create-event-skeleton__preview-copy"></div>
        <div class="skeleton-block create-event-skeleton__preview-pill"></div>
      </div>

      <div class="ce-columns">
        <section class="ce-form">
          <div class="screen">
            <div class="screen-head">
              <div class="skeleton-block create-event-skeleton__headline"></div>
              <div class="skeleton-block create-event-skeleton__headline-accent"></div>
              <div class="skeleton-block create-event-skeleton__intro"></div>
            </div>

            <div class="ce-card">
              <div class="field">
                <div class="skeleton-block create-event-skeleton__label"></div>
                <div class="skeleton-block field-input"></div>
              </div>

              <div class="create-event-skeleton__divider"></div>

              <div class="two-col">
                <div class="field">
                  <div class="skeleton-block create-event-skeleton__label"></div>
                  <div class="skeleton-block field-input"></div>
                </div>
                <div class="field">
                  <div class="skeleton-block create-event-skeleton__label"></div>
                  <div class="skeleton-block field-input"></div>
                </div>
              </div>

              <div class="field">
                <div class="skeleton-block create-event-skeleton__label"></div>
                <div class="create-event-skeleton__chips">
                  <div class="skeleton-block create-event-skeleton__chip"></div>
                  <div class="skeleton-block create-event-skeleton__chip"></div>
                  <div class="skeleton-block create-event-skeleton__chip short"></div>
                </div>
              </div>

              <div class="create-event-skeleton__actions">
                <div class="skeleton-block create-event-skeleton__secondary-btn"></div>
                <div class="skeleton-block create-event-skeleton__primary-btn"></div>
              </div>
            </div>
          </div>
        </section>

        <aside class="preview-col">
          <span class="skeleton-block side-label"></span>
          <div class="create-event-skeleton__event-card">
            <div class="create-event-skeleton__event-media">
              <div class="skeleton-block create-event-skeleton__event-tag"></div>
              <div class="skeleton-block create-event-skeleton__event-date"></div>
              <div class="skeleton-block create-event-skeleton__image-icon"></div>
              <div class="skeleton-block create-event-skeleton__image-copy"></div>
            </div>
            <div class="create-event-skeleton__event-body">
              <div class="skeleton-block create-event-skeleton__event-title"></div>
              <div class="skeleton-block create-event-skeleton__event-title short"></div>
              <div class="skeleton-block create-event-skeleton__event-line"></div>
              <div class="skeleton-block create-event-skeleton__event-price"></div>
            </div>
          </div>
          <div class="tip-card">
            <div class="skeleton-block create-event-skeleton__tip-title"></div>
            <div class="skeleton-block create-event-skeleton__tip-line"></div>
            <div class="skeleton-block create-event-skeleton__tip-line short"></div>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section v-else class="page-skeleton" :class="`page-skeleton--${variant}`" aria-hidden="true">
    <div v-if="!['auth', 'cart', 'not-found'].includes(variant)" class="page-skeleton__header">
      <div class="skeleton-block page-skeleton__eyebrow"></div>
      <div class="skeleton-block page-skeleton__title"></div>
      <div class="skeleton-block page-skeleton__subtitle"></div>
    </div>

    <div v-if="variant === 'detail'" class="page-skeleton__detail">
      <div class="skeleton-block page-skeleton__media"></div>
      <div class="page-skeleton__panel">
        <div class="skeleton-block page-skeleton__panel-title"></div>
        <div
          v-for="row in rowCount"
          :key="`detail-${row}`"
          class="skeleton-block page-skeleton__line"
        ></div>
        <div class="page-skeleton__actions">
          <div class="skeleton-block page-skeleton__button"></div>
          <div class="skeleton-block page-skeleton__button page-skeleton__button--short"></div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'dashboard'" class="page-skeleton__dashboard">
      <div class="page-skeleton__stats">
        <div v-for="stat in 4" :key="`stat-${stat}`" class="page-skeleton__stat">
          <div class="skeleton-block page-skeleton__stat-value"></div>
          <div class="skeleton-block page-skeleton__stat-label"></div>
        </div>
      </div>
      <div class="page-skeleton__table">
        <div
          v-for="row in rowCount + 2"
          :key="`dashboard-${row}`"
          class="page-skeleton__table-row"
        >
          <div class="skeleton-block page-skeleton__avatar"></div>
          <div class="skeleton-block page-skeleton__row-main"></div>
          <div class="skeleton-block page-skeleton__row-side"></div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'form'" class="page-skeleton__form">
      <div class="page-skeleton__form-panel">
        <div
          v-for="field in rowCount + 2"
          :key="`field-${field}`"
          class="skeleton-block page-skeleton__field"
        ></div>
        <div class="skeleton-block page-skeleton__submit"></div>
      </div>
      <div class="page-skeleton__summary">
        <div class="skeleton-block page-skeleton__panel-title"></div>
        <div
          v-for="line in rowCount"
          :key="`summary-${line}`"
          class="skeleton-block page-skeleton__line"
        ></div>
      </div>
    </div>

    <div v-else-if="variant === 'auth'" class="page-skeleton__auth">
      <div class="page-skeleton__auth-panel">
        <div class="skeleton-block page-skeleton__auth-title"></div>
        <div class="skeleton-block page-skeleton__auth-subtitle"></div>
        <div
          v-for="field in 3"
          :key="`auth-field-${field}`"
          class="skeleton-block page-skeleton__field"
        ></div>
        <div class="skeleton-block page-skeleton__submit"></div>
        <div class="skeleton-block page-skeleton__auth-link"></div>
      </div>
    </div>

    <div v-else-if="variant === 'contact'" class="page-skeleton__contact">
      <div class="page-skeleton__contact-info">
        <article
          v-for="card in 3"
          :key="`contact-info-${card}`"
          class="page-skeleton__contact-card"
        >
          <div class="skeleton-block page-skeleton__contact-icon"></div>
          <div class="skeleton-block page-skeleton__panel-title"></div>
          <div class="skeleton-block page-skeleton__line"></div>
          <div class="skeleton-block page-skeleton__line page-skeleton__line--short"></div>
        </article>
      </div>
      <div class="page-skeleton__contact-form">
        <div class="skeleton-block page-skeleton__panel-title"></div>
        <div
          v-for="field in 4"
          :key="`contact-field-${field}`"
          class="skeleton-block page-skeleton__field"
          :class="{ 'page-skeleton__field--textarea': field === 4 }"
        ></div>
        <div class="skeleton-block page-skeleton__submit"></div>
      </div>
    </div>

    <div v-else-if="variant === 'cart'" class="page-skeleton__cart">
      <div class="page-skeleton__cart-head">
        <div class="skeleton-block page-skeleton__button page-skeleton__button--short"></div>
        <div class="skeleton-block page-skeleton__title"></div>
      </div>
      <div class="page-skeleton__cart-list">
        <article v-for="item in 3" :key="`cart-row-${item}`" class="page-skeleton__cart-item">
          <div class="skeleton-block page-skeleton__cart-image"></div>
          <div class="page-skeleton__cart-copy">
            <div class="skeleton-block page-skeleton__panel-title"></div>
            <div class="skeleton-block page-skeleton__line"></div>
            <div class="skeleton-block page-skeleton__line page-skeleton__line--short"></div>
          </div>
          <div class="skeleton-block page-skeleton__cart-qty"></div>
          <div class="skeleton-block page-skeleton__cart-price"></div>
        </article>
      </div>
      <aside class="page-skeleton__cart-summary">
        <div class="skeleton-block page-skeleton__panel-title"></div>
        <div
          v-for="line in 3"
          :key="`cart-summary-${line}`"
          class="skeleton-block page-skeleton__line"
        ></div>
        <div class="skeleton-block page-skeleton__submit"></div>
      </aside>
    </div>

    <div v-else-if="variant === 'blog'" class="page-skeleton__list">
      <article v-for="row in rowCount + 1" :key="`blog-${row}`" class="page-skeleton__list-row">
        <div class="skeleton-block page-skeleton__thumb"></div>
        <div class="page-skeleton__list-content">
          <div class="skeleton-block page-skeleton__panel-title"></div>
          <div class="skeleton-block page-skeleton__line"></div>
          <div class="skeleton-block page-skeleton__line page-skeleton__line--short"></div>
        </div>
      </article>
    </div>

    <div v-else-if="variant === 'not-found'" class="page-skeleton__not-found">
      <div class="skeleton-block page-skeleton__not-found-code"></div>
      <div class="skeleton-block page-skeleton__title"></div>
      <div class="skeleton-block page-skeleton__subtitle"></div>
      <div class="skeleton-block page-skeleton__button"></div>
    </div>

    <div v-else class="page-skeleton__grid">
      <article v-for="card in cardCount" :key="`card-${card}`" class="page-skeleton__card">
        <div class="skeleton-block page-skeleton__card-image"></div>
        <div class="page-skeleton__card-body">
          <div class="skeleton-block page-skeleton__panel-title"></div>
          <div class="skeleton-block page-skeleton__line"></div>
          <div class="skeleton-block page-skeleton__line page-skeleton__line--short"></div>
          <div class="skeleton-block page-skeleton__pill"></div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-skeleton {
  width: min(100% - 32px, 1200px);
  margin: 0 auto;
  padding: clamp(24px, 5vw, 56px) 0;
  color: var(--color-text);
}

.page-skeleton__header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: clamp(24px, 4vw, 40px);
}

.skeleton-block {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--color-skeleton-highlight),
      transparent
    ),
    var(--color-skeleton-base);
  background-size: 220% 100%;
  animation: pageSkeletonShimmer 1.35s ease-in-out infinite;
}

.page-skeleton__eyebrow {
  width: 120px;
  height: 14px;
}

.page-skeleton__title {
  width: min(520px, 82%);
  height: clamp(32px, 5vw, 52px);
}

.page-skeleton__subtitle {
  width: min(680px, 92%);
  height: 18px;
}

.page-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 20px;
}

.page-skeleton__card,
.page-skeleton__panel,
.page-skeleton__form-panel,
.page-skeleton__summary,
.page-skeleton__stat,
.page-skeleton__table,
.page-skeleton__list-row,
.page-skeleton__auth-panel,
.page-skeleton__contact-card,
.page-skeleton__contact-form,
.page-skeleton__cart-item,
.page-skeleton__cart-summary {
  background: var(--color-skeleton-surface);
  border: 1px solid var(--color-skeleton-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--color-shadow);
}

.page-skeleton__card {
  overflow: hidden;
  min-height: 330px;
}

.page-skeleton__card-image {
  height: 178px;
  border-radius: 0;
}

.page-skeleton__card-body,
.page-skeleton__panel,
.page-skeleton__form-panel,
.page-skeleton__summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.page-skeleton__panel-title {
  width: 72%;
  height: 22px;
}

.page-skeleton__line {
  width: 100%;
  height: 14px;
}

.page-skeleton__line--short {
  width: 58%;
}

.page-skeleton__pill {
  width: 42%;
  height: 34px;
  margin-top: 14px;
  border-radius: 999px;
}

.page-skeleton__detail,
.page-skeleton__form {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 24px;
  align-items: start;
}

.page-skeleton__media {
  min-height: clamp(280px, 48vw, 520px);
}

.page-skeleton__actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.page-skeleton__button,
.page-skeleton__submit {
  width: 170px;
  height: 46px;
  border-radius: 999px;
}

.page-skeleton__button--short {
  width: 120px;
}

.page-skeleton__dashboard,
.page-skeleton__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-skeleton__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.page-skeleton__stat {
  padding: 20px;
}

.page-skeleton__stat-value {
  width: 58%;
  height: 34px;
  margin-bottom: 12px;
}

.page-skeleton__stat-label {
  width: 78%;
  height: 14px;
}

.page-skeleton__table {
  display: flex;
  flex-direction: column;
}

.page-skeleton__table-row,
.page-skeleton__list-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) minmax(90px, 0.25fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.page-skeleton__table-row + .page-skeleton__table-row {
  border-top: 1px solid var(--color-card-border);
}

.page-skeleton__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
}

.page-skeleton__row-main {
  height: 18px;
}

.page-skeleton__row-side {
  height: 28px;
}

.page-skeleton__field {
  height: 48px;
}

.page-skeleton__field--textarea {
  height: 138px;
}

.page-skeleton__submit {
  width: 220px;
  margin-top: 8px;
}

.page-skeleton__list-row {
  grid-template-columns: 132px minmax(0, 1fr);
}

.page-skeleton__thumb {
  width: 100%;
  height: 96px;
}

.page-skeleton__auth {
  display: flex;
  justify-content: center;
  padding: clamp(8px, 3vw, 24px) 0;
}

.page-skeleton__auth-panel {
  width: min(100%, 500px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2rem;
}

.page-skeleton__auth-title {
  width: 56%;
  height: 32px;
}

.page-skeleton__auth-subtitle,
.page-skeleton__auth-link {
  width: 72%;
  height: 14px;
}

.page-skeleton__auth-link {
  width: 46%;
  align-self: center;
}

.page-skeleton__contact {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
  gap: 2rem;
}

.page-skeleton__contact-info {
  display: grid;
  gap: 1rem;
}

.page-skeleton__contact-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 10px 14px;
  align-items: center;
  padding: 1.25rem;
}

.page-skeleton__contact-card .page-skeleton__line {
  grid-column: 2;
}

.page-skeleton__contact-icon {
  grid-row: span 3;
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.page-skeleton__contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 2rem;
}

.page-skeleton__cart {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
}

.page-skeleton__cart-head {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.page-skeleton__cart-list {
  display: grid;
  gap: 1rem;
}

.page-skeleton__cart-item {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 92px 96px;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
}

.page-skeleton__cart-image {
  width: 100%;
  height: 84px;
  border-radius: 8px;
}

.page-skeleton__cart-copy,
.page-skeleton__cart-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-skeleton__cart-qty {
  width: 86px;
  height: 36px;
  border-radius: 999px;
}

.page-skeleton__cart-price {
  width: 92px;
  height: 28px;
}

.page-skeleton__cart-summary {
  align-self: start;
  padding: 1.25rem;
}

.page-skeleton__not-found {
  min-height: 48vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  text-align: center;
}

.page-skeleton__not-found-code {
  width: 116px;
  height: 58px;
}

.create-event-skeleton {
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

.create-event-skeleton .ce-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: auto minmax(44px, auto) minmax(0, 1fr) auto;
  gap: clamp(14px, 2vw, 28px);
  align-items: center;
  min-height: var(--app-header-height, 96px);
  padding: 0 1.5rem;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(20px);
}

.create-event-skeleton .ce-logo {
  width: 118px;
  height: var(--app-logo-height, 72px);
  border-radius: 12px;
}

.create-event-skeleton .ce-header-back,
.create-event-skeleton .theme-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
}

.create-event-skeleton .ce-progress {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  min-height: 38px;
  padding: 4px 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-tab-bg) 78%, transparent);
  border: 1px solid var(--color-border);
}

.create-event-skeleton .ce-step {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 74px;
  padding: 5px 10px;
  border-radius: 999px;
}

.create-event-skeleton .ce-step:first-child {
  background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 32%, transparent);
}

.create-event-skeleton .ce-step-number {
  width: 17px;
  height: 17px;
  border-radius: 50%;
}

.create-event-skeleton .ce-step-label {
  width: 42px;
  height: 10px;
  border-radius: 999px;
}

.create-event-skeleton .ce-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.create-event-skeleton .draft-badge {
  width: 86px;
  height: 36px;
  border-radius: 10px;
}

.create-event-skeleton .ghost-btn {
  width: 86px;
  height: 32px;
  border-radius: 10px;
}

.create-event-skeleton__body {
  width: min(100% - 48px, 1160px);
  margin: 0 auto;
  padding: 24px 0 56px;
}

.create-event-skeleton__preview-toggle {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin-bottom: 12px;
}

.create-event-skeleton__preview-copy {
  width: 180px;
  height: 12px;
}

.create-event-skeleton__preview-pill {
  width: 124px;
  height: 34px;
  border-radius: 999px;
}

.create-event-skeleton .ce-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 2rem;
  align-items: start;
}

.create-event-skeleton .screen {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.create-event-skeleton .screen-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.create-event-skeleton__headline {
  width: min(360px, 75%);
  height: 34px;
}

.create-event-skeleton__headline-accent {
  width: 128px;
  height: 30px;
}

.create-event-skeleton__intro {
  width: min(460px, 86%);
  height: 14px;
  margin-top: 8px;
}

.create-event-skeleton .ce-card,
.create-event-skeleton .tip-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: 0 10px 30px var(--color-shadow);
}

.create-event-skeleton .ce-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 1.75rem;
}

.create-event-skeleton .field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.create-event-skeleton__label {
  width: 94px;
  height: 12px;
  border-radius: 999px;
}

.create-event-skeleton .field-input {
  width: 100%;
  height: 56px;
  border-radius: 16px;
}

.create-event-skeleton__divider {
  height: 1px;
  background: var(--color-border);
}

.create-event-skeleton .two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.create-event-skeleton__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.create-event-skeleton__chip {
  width: 104px;
  height: 36px;
  border-radius: 999px;
}

.create-event-skeleton__chip.short {
  width: 78px;
}

.create-event-skeleton__actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 2px;
}

.create-event-skeleton__secondary-btn,
.create-event-skeleton__primary-btn {
  height: 48px;
  border-radius: 14px;
}

.create-event-skeleton__secondary-btn {
  width: 112px;
}

.create-event-skeleton__primary-btn {
  width: 156px;
}

.create-event-skeleton .preview-col {
  position: sticky;
  top: 104px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-event-skeleton .side-label {
  width: 94px;
  height: 11px;
  border-radius: 999px;
}

.create-event-skeleton__event-card {
  overflow: hidden;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 30px var(--color-shadow);
}

.create-event-skeleton__event-media {
  position: relative;
  height: 190px;
  border-bottom: 1px dashed var(--color-border);
  background: color-mix(in srgb, var(--color-skeleton-surface) 70%, transparent);
}

.create-event-skeleton__event-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 52px;
  height: 30px;
  border-radius: 999px;
}

.create-event-skeleton__event-date {
  position: absolute;
  right: 16px;
  bottom: 14px;
  width: 50px;
  height: 72px;
  border-radius: 10px;
}

.create-event-skeleton__image-icon {
  position: absolute;
  top: 72px;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translateX(-50%);
  border-radius: 6px;
}

.create-event-skeleton__image-copy {
  position: absolute;
  top: 108px;
  left: 50%;
  width: 142px;
  height: 11px;
  transform: translateX(-50%);
}

.create-event-skeleton__event-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 20px 28px;
}

.create-event-skeleton__event-title {
  width: 82%;
  height: 18px;
}

.create-event-skeleton__event-title.short {
  width: 48%;
}

.create-event-skeleton__event-line {
  width: 68%;
  height: 14px;
  margin-top: 6px;
}

.create-event-skeleton__event-price {
  width: 78px;
  height: 24px;
}

.create-event-skeleton .tip-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
}

.create-event-skeleton__tip-title {
  width: 44px;
  height: 14px;
}

.create-event-skeleton__tip-line {
  width: 100%;
  height: 12px;
}

.create-event-skeleton__tip-line.short {
  width: 70%;
}

.page-skeleton__list-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@keyframes pageSkeletonShimmer {
  0% {
    background-position: 180% 0;
  }
  100% {
    background-position: -60% 0;
  }
}

@media (max-width: 760px) {
  .page-skeleton {
    width: min(100% - 24px, 1200px);
  }

  .create-event-skeleton .ce-header {
    grid-template-columns: 92px 38px minmax(170px, 1fr) auto;
    gap: 8px;
    min-height: 72px;
    overflow-x: auto;
    padding: 0 1rem;
  }

  .create-event-skeleton .ce-logo {
    width: 92px;
    height: 18px;
  }

  .create-event-skeleton .ce-progress {
    justify-self: start;
    max-width: none;
    min-width: 220px;
  }

  .create-event-skeleton .ce-step {
    min-width: auto;
  }

  .create-event-skeleton .ce-step-label,
  .create-event-skeleton .draft-badge {
    display: none;
  }

  .create-event-skeleton__body {
    width: min(100% - 28px, 640px);
    padding: 18px 0 42px;
  }

  .create-event-skeleton__preview-toggle,
  .create-event-skeleton .preview-col {
    display: none;
  }

  .create-event-skeleton .ce-columns {
    grid-template-columns: 1fr;
  }

  .create-event-skeleton .screen-head {
    padding-top: 10px;
  }

  .create-event-skeleton__headline {
    width: 78%;
    height: 30px;
  }

  .create-event-skeleton__headline-accent {
    width: 116px;
    height: 27px;
  }

  .create-event-skeleton .ce-card {
    border-radius: 18px;
    padding: 1.3rem;
  }

  .create-event-skeleton .two-col {
    grid-template-columns: 1fr;
  }

  .create-event-skeleton__actions {
    flex-direction: column;
  }

  .create-event-skeleton__secondary-btn,
  .create-event-skeleton__primary-btn {
    width: 100%;
  }

  .page-skeleton__detail,
  .page-skeleton__form,
  .page-skeleton__contact,
  .page-skeleton__cart {
    grid-template-columns: 1fr;
  }

  .page-skeleton__auth-panel,
  .page-skeleton__contact-form {
    padding: 1.5rem;
  }

  .page-skeleton__contact-card,
  .page-skeleton__cart-item {
    grid-template-columns: 1fr;
  }

  .page-skeleton__contact-card .page-skeleton__line {
    grid-column: auto;
  }

  .page-skeleton__cart-image {
    height: 160px;
  }

  .page-skeleton__cart-qty,
  .page-skeleton__cart-price {
    width: 48%;
  }

  .page-skeleton__table-row {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .page-skeleton__row-side {
    display: none;
  }

  .page-skeleton__list-row {
    grid-template-columns: 1fr;
  }

  .page-skeleton__thumb {
    height: 180px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}
</style>

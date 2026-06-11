<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'grid', 'detail', 'dashboard', 'form', 'blog', 'create-event'].includes(value),
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
    <div class="page-skeleton__header">
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
.page-skeleton__list-row {
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
  grid-template-columns: 150px 38px minmax(220px, 1fr) auto;
  gap: 1rem;
  align-items: center;
  min-height: 88px;
  padding: 0 1.5rem;
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(20px);
}

.create-event-skeleton .ce-logo {
  width: 142px;
  height: 24px;
  border-radius: 999px;
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
  gap: 5px;
  max-width: 340px;
  min-height: 42px;
  padding: 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-tab-bg) 78%, transparent);
  border: 1px solid var(--color-border);
}

.create-event-skeleton .ce-step {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 62px;
  padding: 5px 8px;
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

.create-event-skeleton__body {
  width: min(100% - 48px, 1030px);
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
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.75rem;
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
  gap: 22px;
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
  .page-skeleton__form {
    grid-template-columns: 1fr;
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

<template>
  <div class="create-event">
    <div class="container">
      <router-link to="/" class="back-link">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>BACK</span>
      </router-link>

      <div class="create-event__header">
        <h1 class="create-event__title">Make Your Event dYZ%</h1>
        <p class="create-event__subtitle">Fill out this form to create your event - it's easy!</p>
        <button type="button" @click="prefillForm" class="prefill-button">
          Prefill with Test Data
        </button>
      </div>

      <div v-if="error" class="create-event__alert create-event__alert--error">
        {{ error }}
      </div>

      <div v-if="success" class="create-event__alert create-event__alert--success">
        Event created successfully! Redirecting to event page...
      </div>

      <form @submit.prevent="handleSubmit" class="create-event__form">
        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Event Information
          </h2>

          <div class="form-group">
            <label for="title" class="form-label">Event Name</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.title.valid }"
              placeholder="What's your event called?"
            />
            <p v-if="!validation.title.valid" class="form-error">{{ validation.title.message }}</p>
            <p v-else class="form-helper">Name it something people will understand right away</p>
          </div>

          <div class="form-group">
            <label for="organizer" class="form-label">Organizer Name</label>
            <input
              id="organizer"
              v-model="form.organizer"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.organizer.valid }"
              placeholder="Who's hosting this?"
            />
            <p v-if="!validation.organizer.valid" class="form-error">
              {{ validation.organizer.message }}
            </p>
          </div>

          <div class="form-group">
            <label for="category" class="form-label">Event Category</label>
            <select
              id="category"
              v-model="form.category"
              class="form-select"
              :class="{ 'form-input--error': !validation.category.valid }"
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <p v-if="!validation.category.valid" class="form-error">
              {{ validation.category.message }}
            </p>
            <p v-else class="form-helper">The right category helps people find your event</p>
          </div>

          <div class="form-group">
            <label class="form-label">Sub Categories</label>
            <div class="subcategories-display">
              <div class="selected-subcategories">
                <div v-if="displayedSubCategories.length === 0" class="no-subcategories">
                  No subcategories selected
                </div>
                <div
                  v-for="(subCat, index) in displayedSubCategories"
                  :key="index"
                  class="selected-subcategory"
                >
                  <span>{{ getSubCategoryName(subCat) }}</span>
                  <button
                    type="button"
                    @click="removeSubCategoryById(subCat)"
                    class="remove-subcategory-btn"
                    aria-label="Remove subcategory"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="openSubCategoryModal"
                class="manage-subcategories-btn"
                :disabled="form.category === ''"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ displayedSubCategories.length ? 'Edit' : 'Add' }} Subcategories</span>
              </button>
            </div>
            <p v-if="!validation.subCategories.valid" class="form-error">
              {{ validation.subCategories.message }}
            </p>
            <p v-else class="form-helper">
              Add up to 5 subcategories to describe your event better
            </p>
          </div>

          <div class="form-group">
            <label for="description" class="form-label">Event Description</label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-textarea"
              :class="{ 'form-input--error': !validation.description.valid }"
              placeholder="Tell people what makes your event special..."
              rows="5"
            ></textarea>
            <p v-if="!validation.description.valid" class="form-error">
              {{ validation.description.message }}
            </p>
            <p v-else class="form-helper">Tell people what will happen at your event</p>
          </div>

          <div class="form-group">
            <label class="form-label">Event Images</label>
            <div class="image-upload-container">
              <div class="image-upload-row">
                <div
                  class="image-upload-dropzone"
                  :class="{ 'has-image': mainImagePreview }"
                  @click="triggerMainImageUpload"
                  @dragover.prevent
                  @drop.prevent="handleMainImageDrop"
                >
                  <img
                    v-if="mainImagePreview"
                    :src="mainImagePreview"
                    alt="Main image preview"
                    class="preview-image"
                  />
                  <div v-if="mainImagePreview" class="image-overlay">
                    <button type="button" class="remove-image-btn" @click.stop="removeMainImage">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <div class="upload-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M3 16L7 12C7.94 11.06 9.44 11.06 10.38 12L16.5 18"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M14 16L16 14C16.94 13.06 18.44 13.06 19.38 14L21 15.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <circle cx="9" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                    <div class="upload-text">
                      <span class="primary-text">Main Event Image</span>
                      <span class="secondary-text">Drag & drop or click to upload</span>
                    </div>
                  </div>
                </div>

                <div
                  class="image-upload-dropzone banner-dropzone"
                  :class="{ 'has-image': bannerImagePreview }"
                  @click="triggerBannerImageUpload"
                  @dragover.prevent
                  @drop.prevent="handleBannerImageDrop"
                >
                  <img
                    v-if="bannerImagePreview"
                    :src="bannerImagePreview"
                    alt="Banner image preview"
                    class="preview-image"
                  />
                  <div v-if="bannerImagePreview" class="image-overlay">
                    <button type="button" class="remove-image-btn" @click.stop="removeBannerImage">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <div class="upload-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="2"
                          y="4"
                          width="20"
                          height="13"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M2 13L6 9C6.94 8.06 8.44 8.06 9.38 9L15.5 15"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M14 13L16 11C16.94 10.06 18.44 10.06 19.38 11L22 13.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <circle cx="8" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                    <div class="upload-text">
                      <span class="primary-text">Banner Image</span>
                      <span class="secondary-text">Drag & drop or click to upload</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="image-inputs">
                <input
                  id="mainImage"
                  ref="mainImageInput"
                  type="file"
                  class="image-input"
                  accept="image/*"
                  @change="handleMainImageUpload"
                />
                <input
                  id="bannerImage"
                  ref="bannerImageInput"
                  type="file"
                  class="image-input"
                  accept="image/*"
                  @change="handleBannerImageUpload"
                />
              </div>
            </div>
            <p
              v-if="!validation.mainImage.valid || !validation.bannerImage.valid"
              class="form-error"
            >
              {{
                !validation.mainImage.valid
                  ? validation.mainImage.message
                  : validation.bannerImage.message
              }}
            </p>
            <p v-else class="form-helper">
              Upload images for your event. The main image will appear on cards throughout the site,
              while the banner will be displayed on your event's detail page.
            </p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Date & Time
          </h2>

          <div class="form-row">
            <div class="form-group">
              <label for="date" class="form-label">Event Date</label>
              <div class="date-picker-wrapper">
                <input
                  id="date"
                  v-model="form.date"
                  type="text"
                  readonly
                  class="form-input date-input"
                  :class="{ 'form-input--error': !validation.date.valid }"
                  :min="today"
                  @click="openDatePicker"
                />
                <div v-if="showDateTip" class="picker-tip">
                  <div class="tip-arrow"></div>
                  <div class="tip-content">
                    <p>Click to open calendar</p>
                    <span>Select a date for your event</span>
                  </div>
                </div>
              </div>
              <p v-if="!validation.date.valid" class="form-error">{{ validation.date.message }}</p>
              <p v-else class="form-helper">Click to open the calendar</p>
            </div>

            <div class="form-group">
              <label for="time" class="form-label">Start Time</label>
              <div class="time-picker-wrapper">
                <input
                  id="time"
                  v-model="form.time"
                  type="text"
                  readonly
                  class="form-input time-input"
                  :class="{ 'form-input--error': !validation.time.valid }"
                  @click="openTimePicker"
                  placeholder="Select a time"
                />
                <div v-if="showTimeTip" class="picker-tip">
                  <div class="tip-arrow"></div>
                  <div class="tip-content">
                    <p>Click to select time</p>
                    <span>Use our easy time selector</span>
                  </div>
                </div>
              </div>
              <p v-if="!validation.time.valid" class="form-error">{{ validation.time.message }}</p>
              <p v-else class="form-helper">Click to open time selector</p>
            </div>
          </div>

          <div class="form-group">
            <label for="duration" class="form-label">Event Duration</label>
            <select id="duration" v-model="form.duration" class="form-select">
              <option value="" disabled>Select duration</option>
              <option v-for="option in durationOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <p class="form-helper">Tell people how long your event will last</p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Location Details
          </h2>

          <div class="form-group">
            <label for="location" class="form-label">Venue Name & Address</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.location.valid }"
              placeholder="Where is your event happening?"
            />
            <p v-if="!validation.location.valid" class="form-error">
              {{ validation.location.message }}
            </p>
            <p v-else class="form-helper">Add the full address so people can find your event</p>
          </div>

          <div class="location-map-placeholder">
            <div class="location-map-content">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <p>Maps coming soon</p>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Ticket Information
          </h2>

          <div v-if="!validation.ticketTypes.valid" class="form-error ticket-types-error">
            {{ validation.ticketTypes.message }}
          </div>

          <div class="ticket-types-container">
            <div v-for="(ticket, index) in form.ticketTypes" :key="index" class="ticket-type-card">
              <div class="ticket-type-header">
                <h3 class="ticket-type-title">Ticket #{{ index + 1 }}</h3>
                <div class="ticket-type-actions">
                  <button
                    type="button"
                    @click="duplicateTicketType(index)"
                    class="ticket-action-btn ticket-action-duplicate"
                    title="Duplicate ticket"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="removeTicketType(index)"
                    class="ticket-action-btn ticket-action-remove"
                    title="Remove ticket"
                    :disabled="form.ticketTypes.length <= 1"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label :for="'ticket-name-' + index" class="form-label">Ticket Name</label>
                <div class="ticket-name-input-wrapper">
                  <input
                    :id="'ticket-name-' + index"
                    v-model="ticket.name"
                    type="text"
                    class="form-input"
                    placeholder="e.g. Early Bird, VIP, General Admission"
                  />
                  <div class="ticket-template-dropdown">
                    <button
                      type="button"
                      class="ticket-template-btn"
                      @click="openTemplateModal(index)"
                    >
                      <span>Templates</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <div class="ticket-template-options">
                      <button
                        v-for="template in ticketTemplates"
                        :key="template.name"
                        type="button"
                        class="ticket-template-option"
                        @click="applyTemplate(index, template)"
                      >
                        {{ template.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label :for="'ticket-price-' + index" class="form-label">Price ($)</label>
                  <input
                    :id="'ticket-price-' + index"
                    v-model.number="ticket.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div class="form-group">
                  <label :for="'ticket-quantity-' + index" class="form-label">Quantity</label>
                  <input
                    :id="'ticket-quantity-' + index"
                    v-model.number="ticket.quantity"
                    type="number"
                    min="1"
                    class="form-input"
                    placeholder="10"
                  />
                </div>
              </div>

              <div class="form-group">
                <label :for="'ticket-description-' + index" class="form-label"
                  >Description (Optional)</label
                >
                <textarea
                  :id="'ticket-description-' + index"
                  v-model="ticket.description"
                  class="form-textarea ticket-description"
                  rows="2"
                  placeholder="Describe what's included with this ticket"
                ></textarea>
              </div>

              <div class="ticket-sales-period">
                <h4 class="ticket-section-subtitle">Sales End Date</h4>
                <p class="ticket-section-helper">
                  Should this ticket type have a deadline? If yes, tell us when sales should stop.
                  This is optional.
                </p>

                <div class="form-row">
                  <div class="form-group">
                    <label :for="'ticket-end-date-' + index" class="form-label">Date</label>
                    <input
                      :id="'ticket-end-date-' + index"
                      v-model="ticket.salesEndDate"
                      type="date"
                      class="form-input"
                      :min="today"
                      :max="form.date"
                    />
                  </div>

                  <div class="form-group">
                    <label :for="'ticket-end-time-' + index" class="form-label">Time</label>
                    <input
                      :id="'ticket-end-time-' + index"
                      v-model="ticket.salesEndTime"
                      type="time"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <div class="form-checkbox-wrapper">
                <input
                  :id="'ticket-featured-' + index"
                  v-model="ticket.isFeatured"
                  type="checkbox"
                  class="form-checkbox"
                />
                <label :for="'ticket-featured-' + index" class="form-checkbox-label">
                  Feature this ticket (highlighted in the ticket selection)
                </label>
              </div>
            </div>

            <button type="button" @click="addTicketType" class="add-ticket-type-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Add Another Ticket Type</span>
            </button>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Event Options
          </h2>

          <p class="section-intro">
            Select features and amenities that your event offers to help attendees know what to
            expect.
          </p>

          <div class="event-options-container">
            <div class="event-options-grid">
              <!-- Predefined event options -->
              <div
                v-for="option in predefinedEventOptions"
                :key="'predefined-' + option"
                class="event-option-item"
                @click="toggleEventOption(option)"
              >
                <div
                  class="event-option-checkbox"
                  :class="{ 'event-option-checkbox--selected': isEventOptionSelected(option) }"
                >
                  <div class="event-option-label">{{ option }}</div>
                  <svg
                    v-if="isEventOptionSelected(option)"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="event-option-checkmark"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <!-- Custom event options -->
              <div
                v-for="(option, index) in form.customEventOptions"
                :key="'custom-' + index"
                class="event-option-item"
              >
                <div class="event-option-checkbox event-option-checkbox--selected">
                  <div class="event-option-label">{{ option }}</div>
                  <button
                    type="button"
                    @click="removeCustomEventOption(index)"
                    class="remove-option-btn"
                    aria-label="Remove option"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="add-event-option">
              <div class="custom-event-option-input">
                <input
                  type="text"
                  v-model="newCustomEventOption"
                  placeholder="Add your own event option..."
                  class="form-input custom-option-input"
                  @keyup.enter="addCustomEventOption"
                />
                <button
                  type="button"
                  class="add-custom-option-btn"
                  @click="addCustomEventOption"
                  :disabled="!newCustomEventOption.trim()"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div class="form-checkbox-wrapper mt-4">
            <input id="featured" v-model="form.featured" type="checkbox" class="form-checkbox" />
            <label for="featured" class="form-checkbox-label">
              Feature this event (additional promotion fee may apply)
            </label>
          </div>
          <p class="form-helper">Featured events show up on the homepage</p>
        </div>

        <!-- Add new FAQ section -->
        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Frequently Asked Questions
            <span class="section-optional">(Optional)</span>
          </h2>

          <p class="section-intro">
            Help attendees by answering common questions about your event. You can edit these
            defaults or add your own.
          </p>

          <div class="faq-container">
            <div v-for="(faq, index) in form.faqs" :key="index" class="faq-item">
              <div class="faq-header">
                <h3 class="faq-number">Q{{ index + 1 }}</h3>
                <div class="faq-actions">
                  <button
                    type="button"
                    @click="removeFaq(index)"
                    class="faq-action-btn faq-action-remove"
                    title="Remove question"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="faq-content">
                <div class="form-group">
                  <label :for="'faq-question-' + index" class="form-label">Question</label>
                  <input
                    :id="'faq-question-' + index"
                    v-model="faq.question"
                    type="text"
                    class="form-input"
                    placeholder="Enter a question guests might ask"
                  />
                </div>

                <div class="form-group">
                  <label :for="'faq-answer-' + index" class="form-label">Answer</label>
                  <textarea
                    :id="'faq-answer-' + index"
                    v-model="faq.answer"
                    class="form-textarea faq-answer"
                    rows="3"
                    placeholder="Provide a clear answer to the question"
                  ></textarea>
                </div>
              </div>
            </div>

            <button type="button" @click="addFaq" class="add-faq-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Add Another Question</span>
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="resetForm" class="btn-secondary" :disabled="isSubmitting">
            Reset Form
          </button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">
              <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
              </svg>
              Creating Event...
            </span>
            <span v-else>Create Event</span>
          </button>
        </div>
      </form>

      <div class="create-event__note">
        <p>
          <strong>Note:</strong> Your event data is saved locally for now. Online saving coming
          soon.
        </p>
      </div>
    </div>

    <div
      v-if="showTemplateModal"
      class="ticket-template-modal-overlay"
      @click.self="closeTemplateModal"
    >
      <div class="ticket-template-modal">
        <div class="ticket-template-modal-header">
          <h3>Choose a Ticket Template</h3>
          <button @click="closeTemplateModal" class="modal-close-btn" aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="ticket-template-modal-body">
          <div
            v-for="template in ticketTemplates"
            :key="template.name"
            class="template-card"
            @click="applyTemplateFromModal(activeTicketIndex, template)"
          >
            <div class="template-card-content">
              <h4 class="template-name">{{ template.name }}</h4>
              <p class="template-description">{{ template.description }}</p>
            </div>
            <div class="template-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add subcategory modal -->
    <div
      v-if="showSubCategoryModal"
      class="subcategory-modal-overlay"
      @click.self="closeSubCategoryModal"
    >
      <div class="subcategory-modal">
        <div class="subcategory-modal-header">
          <h3>Select or Add Subcategories</h3>
          <button @click="closeSubCategoryModal" class="modal-close-btn" aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="subcategory-modal-body">
          <p class="subcategory-modal-info">Select up to 5 subcategories or add your own</p>

          <div class="subcategory-search">
            <input
              type="text"
              v-model="subcategorySearchTerm"
              placeholder="Search subcategories..."
              class="subcategory-search-input"
            />
          </div>

          <div class="subcategory-options">
            <div class="subcategory-section">
              <h4 class="subcategory-section-title">Available Subcategories</h4>
              <div class="subcategory-chips">
                <div
                  v-for="subCategory in filteredSubCategories"
                  :key="subCategory.id"
                  class="subcategory-chip"
                  :class="{ 'subcategory-chip--selected': isSubCategorySelected(subCategory.id) }"
                  @click="toggleSubCategory(subCategory.id)"
                >
                  <span>{{ subCategory.name }}</span>
                  <svg
                    v-if="isSubCategorySelected(subCategory.id)"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="subcategory-section">
              <h4 class="subcategory-section-title">Custom Subcategories</h4>
              <div class="custom-subcategory-input">
                <input
                  type="text"
                  v-model="newCustomSubCategory"
                  placeholder="Enter your own subcategory..."
                  class="form-input custom-input"
                  @keyup.enter="addCustomSubCategory"
                />
                <button
                  type="button"
                  class="add-custom-btn"
                  @click="addCustomSubCategory"
                  :disabled="!newCustomSubCategory.trim()"
                >
                  Add
                </button>
              </div>

              <div class="subcategory-chips custom-chips">
                <div
                  v-for="(custom, index) in customSubCategories"
                  :key="'custom-' + index"
                  class="subcategory-chip subcategory-chip--custom"
                >
                  <span>{{ custom }}</span>
                  <button
                    class="remove-custom-btn"
                    @click="removeCustomSubCategory(index)"
                    aria-label="Remove"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="subcategory-modal-footer">
            <div class="subcategory-summary">
              <span class="subcategory-count">{{ selectedSubCategoriesCount }}/5 selected</span>
            </div>
            <div class="subcategory-actions">
              <button type="button" class="btn-secondary" @click="closeSubCategoryModal">
                Cancel
              </button>
              <button type="button" class="btn-primary" @click="confirmSubCategories">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Time Picker Modal -->
    <div v-if="isTimePickerOpen" class="time-picker-overlay" @click.self="closeTimePicker">
      <div class="time-picker-modal">
        <div class="time-picker-header">
          <h3>Select Time</h3>
          <button type="button" class="time-picker-close" @click="closeTimePicker">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="time-picker-body">
          <!-- Custom time input -->
          <div class="custom-time-input">
            <div class="time-input-group">
              <input
                type="text"
                v-model="customHours"
                class="time-input-field"
                maxlength="2"
                @focus="$event.target.select()"
                @blur="formatTimeInputs"
                @keydown="handleTimeInput"
                placeholder="HH"
              />
              <span class="time-divider">:</span>
              <input
                type="text"
                v-model="customMinutes"
                class="time-input-field"
                maxlength="2"
                @focus="$event.target.select()"
                @blur="formatTimeInputs"
                @keydown="handleTimeInput"
                placeholder="MM"
              />
            </div>
          </div>

          <div class="time-picker-grid">
            <div
              v-for="time in timeOptions"
              :key="time"
              class="time-option"
              :class="{ selected: selectedTime === time }"
              @click="selectTime(time)"
            >
              {{ time }}
            </div>
          </div>
          <div class="time-period-selector">
            <button
              type="button"
              class="time-period-btn"
              :class="{ selected: selectedPeriod === 'AM' }"
              @click="selectPeriod('AM')"
            >
              AM
            </button>
            <button
              type="button"
              class="time-period-btn"
              :class="{ selected: selectedPeriod === 'PM' }"
              @click="selectPeriod('PM')"
            >
              PM
            </button>
          </div>
        </div>
        <div class="time-picker-actions">
          <button type="button" class="time-picker-btn time-picker-cancel" @click="closeTimePicker">
            Cancel
          </button>
          <button
            type="button"
            class="time-picker-btn time-picker-apply"
            @click="applyTimeSelection"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Date Picker Modal -->
    <div v-if="isDatePickerOpen" class="date-picker-overlay" @click.self="closeDatePicker">
      <div class="date-picker-modal">
        <div class="date-picker-header">
          <h3>Select Date</h3>
          <button type="button" class="date-picker-close" @click="closeDatePicker">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="date-picker-body">
          <div class="date-picker-month-nav">
            <button class="month-nav-btn" @click="previousMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div class="month-display">{{ monthNames[currentMonth] }} {{ currentYear }}</div>
            <button class="month-nav-btn" @click="nextMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div class="date-picker-weekdays">
            <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          </div>

          <div class="date-picker-days">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': !day.inCurrentMonth,
                today: day.isToday,
                selected: day.isSelected,
                disabled: day.isDisabled,
              }"
              @click="!day.isDisabled && selectDate(day.date)"
            >
              {{ day.day }}
            </div>
          </div>
        </div>
        <div class="date-picker-actions">
          <button type="button" class="date-picker-btn date-picker-cancel" @click="closeDatePicker">
            Cancel
          </button>
          <button
            type="button"
            class="date-picker-btn date-picker-apply"
            @click="applyDateSelection"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'

// Initialize references
const router = useRouter()
const eventStore = useEventStore()
const error = ref(null)
const success = ref(false)
const isSubmitting = ref(false)
const today = ref(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format
const showTemplateModal = ref(false)
const activeTicketIndex = ref(0)
const showSubCategoryModal = ref(false)
const tempSelectedSubCategories = ref([]) // Temporary storage for selected subcategories in modal
const subCategorySearchTerm = ref('')
const customSubCategories = ref([])
const newCustomSubCategory = ref('')
const categories = ref([])
const availableSubCategories = ref([])
const mainImagePreview = ref(null)
const bannerImagePreview = ref(null)
const newCustomEventOption = ref('')

// Also initialize form with image fields
const form = reactive({
  title: '',
  description: '',
  category: '',
  subCategories: [],
  date: '',
  time: '19:00',
  location: '',
  price: 0,
  totalTickets: 100,
  organizer: '',
  duration: '',
  featured: false,
  imageIndex: Math.floor(Math.random() * 4), // Random image from available set
  mainImage: null,
  bannerImage: null,
  selectedEventOptions: [], // Start with no options selected
  customEventOptions: [], // For user-added custom options
  ticketTypes: [
    {
      name: 'General Admission',
      price: 0,
      quantity: 100,
      description: '',
      salesEndDate: '',
      salesEndTime: '23:59',
      isFeatured: false,
    },
  ],
  // Add FAQs to the form data
  faqs: [
    {
      question: "What's included in the ticket price?",
      answer:
        'Your ticket includes entry to the event, access to all scheduled activities, and any materials needed for workshops. Food and drinks may be available for purchase separately.',
    },
    {
      question: "What's the refund policy?",
      answer:
        'Tickets can be refunded up to 7 days before the event. After that, no refunds will be issued, but tickets are transferable to another person.',
    },
    {
      question: 'Is there parking available?',
      answer:
        'Limited parking is available at the venue. We recommend using public transportation or rideshare services if possible.',
    },
    {
      question: 'What should I bring with me?',
      answer:
        'Please bring your ticket (digital or printed), a valid ID, and any personal items you might need. Comfortable attire is recommended.',
    },
    {
      question: 'Are there age restrictions for this event?',
      answer:
        'This event is open to attendees of all ages. Children under 12 must be accompanied by an adult.',
    },
  ],
})

// Form validation
const validation = reactive({
  title: { valid: true, message: '' },
  description: { valid: true, message: '' },
  category: { valid: true, message: '' },
  subCategories: { valid: true, message: '' },
  date: { valid: true, message: '' },
  time: { valid: true, message: '' },
  location: { valid: true, message: '' },
  price: { valid: true, message: '' },
  totalTickets: { valid: true, message: '' },
  organizer: { valid: true, message: '' },
  ticketTypes: { valid: true, message: '' },
  mainImage: { valid: true, message: '' },
  bannerImage: { valid: true, message: '' },
})

// Fetch categories on mount
onMounted(async () => {
  try {
    // This will be replaced with API call later
    const eventService = (await import('@/services/eventService')).default
    categories.value = await eventService.getAllCategories()

    // Get sub-categories or initialize with mock data if the service doesn't provide them
    try {
      availableSubCategories.value = await eventService.getAllSubCategories()
    } catch {
      // If the service doesn't have getAllSubCategories method yet, use mock data
      availableSubCategories.value = [
        { id: 'sub1', name: 'Workshop' },
        { id: 'sub2', name: 'Conference' },
        { id: 'sub3', name: 'Meetup' },
        { id: 'sub4', name: 'Webinar' },
        { id: 'sub5', name: 'Party' },
        { id: 'sub6', name: 'Exhibition' },
        { id: 'sub7', name: 'Concert' },
        { id: 'sub8', name: 'Sport Event' },
      ]
    }
  } catch (err) {
    error.value = 'Failed to load categories'
    console.error('Error loading categories:', err)
  }
})

// Add ticket type
const addTicketType = () => {
  form.ticketTypes.push({
    name: '',
    price: 0,
    quantity: 50,
    description: '',
    salesEndDate: '',
    salesEndTime: '23:59',
    isFeatured: false,
  })
}

// Remove ticket type
const removeTicketType = (index) => {
  form.ticketTypes.splice(index, 1)
}

// Duplicate ticket type
const duplicateTicketType = (index) => {
  const ticketToDuplicate = { ...form.ticketTypes[index] }
  ticketToDuplicate.name = `${ticketToDuplicate.name} (Copy)`
  form.ticketTypes.splice(index + 1, 0, ticketToDuplicate)
}

// Available ticket type templates
const ticketTemplates = [
  { name: 'Standard', description: 'Regular entry ticket for most guests', isFeatured: false },
  { name: 'Early Bird', description: 'Limited time offer at a discounted price', isFeatured: true },
  { name: 'VIP', description: 'Premium experience with exclusive benefits', isFeatured: true },
  { name: 'Table for 4', description: 'Reserved table seating for 4 guests' },
  { name: 'Table for 8', description: 'Reserved table seating for 8 guests' },
  { name: 'Table for 12', description: 'Reserved table seating for a large group of 12' },
  {
    name: 'Gold',
    description: 'Elite experience with exclusive perks and priority service',
    isFeatured: true,
  },
  { name: 'Student', description: 'Discounted ticket with valid student ID' },
  { name: 'Group (5+)', description: 'Discounted rate for groups of 5 or more' },
]

// Apply template to ticket
const applyTemplate = (index, template) => {
  form.ticketTypes[index].name = template.name
  form.ticketTypes[index].description = template.description
  if (template.isFeatured) {
    form.ticketTypes[index].isFeatured = true
  }
}

// Calculate total tickets
const calculateTotalTickets = computed(() => {
  return form.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)
})

// Update total tickets when ticket quantities change
watch(calculateTotalTickets, (newTotal) => {
  form.totalTickets = newTotal
})

// Computed combined date and time
const fullDateTime = computed(() => {
  if (!form.date || !form.time) return null
  const [year, month, day] = form.date.split('-')
  const [hours, minutes] = form.time.split(':')
  return new Date(year, month - 1, day, hours, minutes).toISOString()
})

// Duration options
const durationOptions = [
  '1 hour',
  '2 hours',
  '3 hours',
  '4 hours',
  '5 hours',
  '1 day',
  '2 days',
  '3 days',
  'Multiple days',
]

// Define stronger password regex if using authentication
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  // Basic sanitization - replaces potentially harmful characters
  return input.replace(/[<>&"'`=/]/g, '')
}

// Validate form with enhanced security
const validateForm = () => {
  let isValid = true

  // Title validation with sanitization
  const sanitizedTitle = sanitizeInput(form.title.trim())
  if (!sanitizedTitle) {
    validation.title.valid = false
    validation.title.message = 'Add a name for your event'
    isValid = false
  } else if (sanitizedTitle.length < 5) {
    validation.title.valid = false
    validation.title.message = 'Name needs at least 5 letters'
    isValid = false
  } else if (sanitizedTitle.length > 100) {
    validation.title.valid = false
    validation.title.message = 'Name is too long (100 letters max)'
    isValid = false
  } else {
    validation.title.valid = true
    // Update the form with sanitized value
    form.title = sanitizedTitle
  }

  // Description validation with sanitization
  const sanitizedDescription = sanitizeInput(form.description.trim())
  if (!sanitizedDescription) {
    validation.description.valid = false
    validation.description.message = 'Add a description'
    isValid = false
  } else if (sanitizedDescription.length < 20) {
    validation.description.valid = false
    validation.description.message = 'Write at least 20 letters'
    isValid = false
  } else if (sanitizedDescription.length > 5000) {
    validation.description.valid = false
    validation.description.message = 'Too long! Keep it under 5000 letters'
    isValid = false
  } else {
    validation.description.valid = true
    // Update the form with sanitized value
    form.description = sanitizedDescription
  }

  // Category validation
  if (!form.category) {
    validation.category.valid = false
    validation.category.message = 'Pick a category'
    isValid = false
  } else {
    // Validate category ID exists in valid categories
    const categoryExists = categories.value.some((cat) => cat.id === form.category)
    if (!categoryExists) {
      validation.category.valid = false
      validation.category.message = 'Pick a category from the list'
      isValid = false
    } else {
      validation.category.valid = true
    }
  }

  // Sub-categories validation
  const nonEmptySubCategories = form.subCategories.filter((cat) => cat !== '')
  const uniqueSubCategories = [...new Set(nonEmptySubCategories)]

  if (nonEmptySubCategories.length !== uniqueSubCategories.length) {
    validation.subCategories.valid = false
    validation.subCategories.message = 'You picked the same tag twice'
    isValid = false
  } else {
    // Validate each subcategory ID exists in valid subcategories
    const invalidSubCat = nonEmptySubCategories.some(
      (subCat) => !availableSubCategories.value.some((validSubCat) => validSubCat.id === subCat),
    )

    if (invalidSubCat) {
      validation.subCategories.valid = false
      validation.subCategories.message = 'Pick tags from the list'
      isValid = false
    } else {
      validation.subCategories.valid = true
    }
  }

  // Date validation
  if (!form.date) {
    validation.date.valid = false
    validation.date.message = 'Pick a date'
    isValid = false
  } else {
    // Validate date format and ensure it's not in the past
    const selectedDate = new Date(form.date)
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    if (isNaN(selectedDate.getTime())) {
      validation.date.valid = false
      validation.date.message = "This date won't work"
      isValid = false
    } else if (selectedDate < currentDate) {
      validation.date.valid = false
      validation.date.message = 'Pick a date in the future'
      isValid = false
    } else {
      validation.date.valid = true
    }
  }

  // Time validation
  if (!form.time) {
    validation.time.valid = false
    validation.time.message = 'Add a start time'
    isValid = false
  } else {
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(form.time)) {
      validation.time.valid = false
      validation.time.message = 'Use hours:minutes format'
      isValid = false
    } else {
      validation.time.valid = true
    }
  }

  // Location validation with sanitization
  const sanitizedLocation = sanitizeInput(form.location.trim())
  if (!sanitizedLocation) {
    validation.location.valid = false
    validation.location.message = 'Add a location'
    isValid = false
  } else if (sanitizedLocation.length < 5) {
    validation.location.valid = false
    validation.location.message = 'Write a longer address'
    isValid = false
  } else {
    validation.location.valid = true
    // Update the form with sanitized value
    form.location = sanitizedLocation
  }

  // Price validation
  if (isNaN(form.price) || form.price === '') {
    validation.price.valid = false
    validation.price.message = 'Price must be a number'
    isValid = false
  } else {
    const price = parseFloat(form.price)
    if (price < 0) {
      validation.price.valid = false
      validation.price.message = "Price can't be negative"
      isValid = false
    } else if (price > 100000) {
      validation.price.valid = false
      validation.price.message = 'Price too high (max $100,000)'
      isValid = false
    } else {
      validation.price.valid = true
      // Ensure price is stored as a number with 2 decimal places
      form.price = parseFloat(price.toFixed(2))
    }
  }

  // Tickets validation
  if (isNaN(form.totalTickets) || form.totalTickets === '') {
    validation.totalTickets.valid = false
    validation.totalTickets.message = 'How many tickets?'
    isValid = false
  } else {
    const tickets = parseInt(form.totalTickets)
    if (tickets <= 0) {
      validation.totalTickets.valid = false
      validation.totalTickets.message = 'You need at least 1 ticket'
      isValid = false
    } else if (tickets > 100000) {
      validation.totalTickets.valid = false
      validation.totalTickets.message = 'Too many tickets (max 100,000)'
      isValid = false
    } else {
      validation.totalTickets.valid = true
      // Ensure tickets is stored as an integer
      form.totalTickets = tickets
    }
  }

  // Organizer validation with sanitization
  const sanitizedOrganizer = sanitizeInput(form.organizer.trim())
  if (!sanitizedOrganizer) {
    validation.organizer.valid = false
    validation.organizer.message = 'Add your name or group name'
    isValid = false
  } else {
    validation.organizer.valid = true
    // Update the form with sanitized value
    form.organizer = sanitizedOrganizer
  }

  // Ticket types validation
  if (form.ticketTypes.length === 0) {
    validation.ticketTypes.valid = false
    validation.ticketTypes.message = 'Add at least one ticket type'
    isValid = false
  } else {
    let ticketTypeValid = true
    form.ticketTypes.forEach((ticket, index) => {
      const sanitizedName = sanitizeInput(ticket.name.trim())
      if (!sanitizedName) {
        validation.ticketTypes.valid = false
        validation.ticketTypes.message = `Ticket #${index + 1} needs a name`
        ticketTypeValid = false
        isValid = false
      }

      if (ticket.quantity <= 0) {
        validation.ticketTypes.valid = false
        validation.ticketTypes.message = `Ticket #${index + 1} needs at least 1`
        ticketTypeValid = false
        isValid = false
      }

      if (ticket.salesEndDate) {
        const endDate = new Date(ticket.salesEndDate)
        const eventDate = new Date(form.date)

        if (isNaN(endDate.getTime())) {
          validation.ticketTypes.valid = false
          validation.ticketTypes.message = `Ticket #${index + 1} has a bad date`
          ticketTypeValid = false
          isValid = false
        } else if (endDate > eventDate) {
          validation.ticketTypes.valid = false
          validation.ticketTypes.message = `Ticket #${index + 1} must stop selling before event starts`
          ticketTypeValid = false
          isValid = false
        }
      }
    })

    if (ticketTypeValid) {
      validation.ticketTypes.valid = true
    }
  }

  // Main image validation
  if (!form.mainImage) {
    validation.mainImage.valid = false
    validation.mainImage.message = 'Upload a main image'
    isValid = false
  }

  // Banner image validation
  if (!form.bannerImage) {
    validation.bannerImage.valid = false
    validation.bannerImage.message = 'Upload a banner image'
    isValid = false
  }

  return isValid
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    // Scroll to first error
    const firstError = Object.keys(validation).find((key) => !validation[key].valid)
    if (firstError) {
      const element = document.getElementById(firstError)
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    // Filter out empty sub-categories and combine with custom subcategories
    const validSubCategories = [
      ...form.subCategories.filter((cat) => cat !== ''),
      ...customSubCategories.value,
    ]

    // Process ticket types
    const processedTickets = form.ticketTypes.map((ticket) => ({
      ...ticket,
      price: parseFloat(ticket.price),
      quantity: parseInt(ticket.quantity),
      name: sanitizeInput(ticket.name.trim()),
      description: sanitizeInput(ticket.description.trim()),
    }))

    // Process images - convert File objects to data URLs
    let mainImageUrl = mainImagePreview.value
    let bannerImageUrl = bannerImagePreview.value

    // Get the selected event options
    const selectedEventOptions = [...form.selectedEventOptions, ...form.customEventOptions].filter(
      Boolean,
    ) // Remove any falsy values

    // Prepare the event data
    const eventData = {
      title: form.title,
      description: form.description,
      category: form.category,
      subCategories: validSubCategories,
      date: fullDateTime.value,
      location: form.location,
      price: parseFloat(form.price),
      totalTickets: parseInt(form.totalTickets),
      organizer: form.organizer,
      duration: form.duration,
      featured: form.featured,
      imageIndex: form.imageIndex,
      mainImage: mainImageUrl,
      bannerImage: bannerImageUrl,
      eventOptions: selectedEventOptions, // Add event options to the event data
      selectedEventOptions: form.selectedEventOptions, // Store the original selected options
      customEventOptions: form.customEventOptions, // Store the custom options
      ticketTypes: processedTickets,
      faqs: form.faqs.filter((faq) => faq.question.trim() && faq.answer.trim()), // Only include FAQs with content
    }

    // Create the event
    const newEvent = await eventStore.createEvent(eventData)

    success.value = true

    // Redirect to the event page after a brief delay
    setTimeout(() => {
      router.push({ path: `/event/${newEvent.id}` })
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Failed to create event'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  Object.keys(form).forEach((key) => {
    if (key === 'price') {
      form[key] = 0
    } else if (key === 'totalTickets') {
      form[key] = 100
    } else if (key === 'featured') {
      form[key] = false
    } else if (key === 'imageIndex') {
      form[key] = Math.floor(Math.random() * 4)
    } else if (key === 'time') {
      form[key] = '19:00'
    } else if (key === 'subCategories') {
      form[key] = []
    } else if (key === 'ticketTypes') {
      form[key] = [
        {
          name: 'General Admission',
          price: 0,
          quantity: 100,
          description: '',
          salesEndDate: '',
          salesEndTime: '23:59',
          isFeatured: false,
        },
      ]
    } else {
      form[key] = ''
    }
  })

  Object.keys(validation).forEach((key) => {
    validation[key].valid = true
    validation[key].message = ''
  })

  error.value = null
  success.value = false

  // Also reset custom subcategories
  customSubCategories.value = []

  // Reset custom event options
  form.customEventOptions = []

  // Reset event options to defaults
  form.selectedEventOptions = ['Live performance', 'Food & drinks available', 'Indoor event']

  // Reset FAQs to defaults
  form.faqs = [
    {
      question: "What's included in the ticket price?",
      answer:
        'Your ticket includes entry to the event, access to all scheduled activities, and any materials needed for workshops. Food and drinks may be available for purchase separately.',
    },
    {
      question: "What's the refund policy?",
      answer:
        'Tickets can be refunded up to 7 days before the event. After that, no refunds will be issued, but tickets are transferable to another person.',
    },
    {
      question: 'Is there parking available?',
      answer:
        'Limited parking is available at the venue. We recommend using public transportation or rideshare services if possible.',
    },
    {
      question: 'What should I bring with me?',
      answer:
        'Please bring your ticket (digital or printed), a valid ID, and any personal items you might need. Comfortable attire is recommended.',
    },
    {
      question: 'Are there age restrictions for this event?',
      answer:
        'This event is open to attendees of all ages. Children under 12 must be accompanied by an adult.',
    },
  ]
}

// Set min date to today for date picker
// const today = new Date().toISOString().split('T')[0]

// Open template modal for a specific ticket
const openTemplateModal = (index) => {
  activeTicketIndex.value = index
  showTemplateModal.value = true
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

// Close template modal
const closeTemplateModal = () => {
  showTemplateModal.value = false
  document.body.style.overflow = '' // Re-enable scrolling
}

// Apply template from modal and close the modal
const applyTemplateFromModal = (index, template) => {
  applyTemplate(index, template)
  closeTemplateModal()
}

// Add FAQ
const addFaq = () => {
  form.faqs.push({
    question: '',
    answer: '',
  })
}

// Remove FAQ
const removeFaq = (index) => {
  form.faqs.splice(index, 1)
}

// Handle main image upload
const handleMainImageUpload = (event) => {
  let file

  // Check if it's a drop event
  if (event.dataTransfer) {
    file = event.dataTransfer.files[0]
  } else if (event.target.files) {
    file = event.target.files[0]
  }

  if (file) {
    form.mainImage = file
    validation.mainImage.valid = true

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      mainImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Handle banner image upload
const handleBannerImageUpload = (event) => {
  let file

  // Check if it's a drop event
  if (event.dataTransfer) {
    file = event.dataTransfer.files[0]
  } else if (event.target.files) {
    file = event.target.files[0]
  }

  if (file) {
    form.bannerImage = file
    validation.bannerImage.valid = true

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      bannerImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Remove main image - could be added to the UI if needed
const removeMainImage = () => {
  form.mainImage = null
  mainImagePreview.value = null
  validation.mainImage.valid = false
  validation.mainImage.message = 'Please upload a main image'
}

// Remove banner image - could be added to the UI if needed
const removeBannerImage = () => {
  form.bannerImage = null
  bannerImagePreview.value = null
  validation.bannerImage.valid = false
  validation.bannerImage.message = 'Please upload a banner image'
}

// Trigger main image upload
const triggerMainImageUpload = () => {
  const input = document.getElementById('mainImage')
  input.click()
}

// Trigger banner image upload
const triggerBannerImageUpload = () => {
  const input = document.getElementById('bannerImage')
  input.click()
}

// Add custom subcategory
const addCustomSubCategory = () => {
  const trimmed = newCustomSubCategory.value.trim()
  if (
    trimmed &&
    customSubCategories.value.length < 5 &&
    !customSubCategories.value.includes(trimmed)
  ) {
    customSubCategories.value.push(trimmed)
    newCustomSubCategory.value = ''
  }
}

// Remove custom subcategory
const removeCustomSubCategory = (index) => {
  customSubCategories.value.splice(index, 1)
}

// Get all displayed subcategories (selected + custom)
const displayedSubCategories = computed(() => {
  return [...form.subCategories, ...customSubCategories.value]
})

// Get subcategory name by id
const getSubCategoryName = (subCatId) => {
  // If it's a predefined subcategory
  if (typeof subCatId === 'string' && subCatId.startsWith('sub')) {
    const subCat = availableSubCategories.value.find((sc) => sc.id === subCatId)
    return subCat ? subCat.name : subCatId
  }
  // If it's a custom subcategory
  return subCatId
}

// Filter subcategories based on search term
const filteredSubCategories = computed(() => {
  if (!subCategorySearchTerm.value) return availableSubCategories.value

  const searchTerm = subCategorySearchTerm.value.toLowerCase()
  return availableSubCategories.value.filter((sc) => sc.name.toLowerCase().includes(searchTerm))
})

// Count selected subcategories
const selectedSubCategoriesCount = computed(() => {
  return tempSelectedSubCategories.value.length + customSubCategories.value.length
})

// Remove a subcategory from the form
const removeSubCategoryById = (subCat) => {
  if (typeof subCat === 'string' && subCat.startsWith('sub')) {
    // If it's a predefined subcategory
    form.subCategories = form.subCategories.filter((sc) => sc !== subCat)
  } else {
    // If it's a custom subcategory
    customSubCategories.value = customSubCategories.value.filter((sc) => sc !== subCat)
  }
}

// Toggle subcategory selection
const toggleSubCategory = (id) => {
  if (isSubCategorySelected(id)) {
    tempSelectedSubCategories.value = tempSelectedSubCategories.value.filter(
      (subCatId) => subCatId !== id,
    )
  } else {
    if (selectedSubCategoriesCount.value < 5) {
      tempSelectedSubCategories.value.push(id)
    }
  }
}

// Check if subcategory is selected
const isSubCategorySelected = (id) => {
  return tempSelectedSubCategories.value.includes(id)
}

// Open subcategory modal
const openSubCategoryModal = () => {
  if (form.category === '') {
    validation.category.valid = false
    validation.category.message = 'Select a category first'
    // Focus category dropdown
    const categoryElement = document.getElementById('category')
    if (categoryElement) categoryElement.focus()
    return
  }

  // Initialize the temp selection with current selection
  tempSelectedSubCategories.value = [...form.subCategories]
  showSubCategoryModal.value = true
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

// Close subcategory modal
const closeSubCategoryModal = () => {
  showSubCategoryModal.value = false
  document.body.style.overflow = '' // Re-enable scrolling
  subCategorySearchTerm.value = ''
  newCustomSubCategory.value = ''
}

// Confirm subcategory selections
const confirmSubCategories = () => {
  form.subCategories = [...tempSelectedSubCategories.value]
  closeSubCategoryModal()
}

// Handle main image drop
const handleMainImageDrop = (event) => {
  event.preventDefault()
  handleMainImageUpload(event)
}

// Handle banner image drop
const handleBannerImageDrop = (event) => {
  event.preventDefault()
  handleBannerImageUpload(event)
}

// Add custom event option
const addCustomEventOption = () => {
  const trimmed = newCustomEventOption.value.trim()
  if (trimmed && form.customEventOptions.length < 5 && !form.customEventOptions.includes(trimmed)) {
    form.customEventOptions.push(trimmed)
    newCustomEventOption.value = ''
  }
}

// Remove custom event option
const removeCustomEventOption = (index) => {
  form.customEventOptions.splice(index, 1)
}

// Toggle event option
const toggleEventOption = (option) => {
  if (form.selectedEventOptions.includes(option)) {
    form.selectedEventOptions = form.selectedEventOptions.filter((opt) => opt !== option)
  } else {
    // Allow selecting more options - remove limit
    form.selectedEventOptions.push(option)
  }
}

// Check if event option is selected
const isEventOptionSelected = (option) => {
  return form.selectedEventOptions.includes(option)
}

// Predefined event options
const predefinedEventOptions = [
  'Live performance',
  'Food & drinks available',
  'Indoor event',
  'Outdoor event',
  'Accessible venue',
  'Family friendly',
  'Free parking',
  'VIP access',
  'Professional networking',
  'Photo opportunities',
  'Live streaming',
  'Q&A session',
  'Merchandise available',
  'Meet & greet',
  'Seating provided',
]

const showDateTip = ref(false)
const showTimeTip = ref(false)

// Time picker variables
const isTimePickerOpen = ref(false)
const selectedTime = ref('07:00')
const selectedPeriod = ref('AM')

const timeOptions = [
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
]

const openTimePicker = () => {
  // If there's already a time, parse it to 12-hour format for the picker
  if (form.time) {
    const [hours, minutes] = form.time.split(':')
    const hour = parseInt(hours)

    if (hour > 12) {
      // Convert from 24-hour to 12-hour format for PM
      selectedTime.value = `${(hour - 12).toString().padStart(2, '0')}:${minutes}`
      selectedPeriod.value = 'PM'
    } else if (hour === 12) {
      // 12 PM
      selectedTime.value = `12:${minutes}`
      selectedPeriod.value = 'PM'
    } else if (hour === 0) {
      // 12 AM
      selectedTime.value = `12:${minutes}`
      selectedPeriod.value = 'AM'
    } else {
      // Regular AM hours
      selectedTime.value = `${hour.toString().padStart(2, '0')}:${minutes}`
      selectedPeriod.value = 'AM'
    }
  } else {
    // Default to 7:00 AM if no time selected
    selectedTime.value = '07:00'
    selectedPeriod.value = 'AM'
  }

  isTimePickerOpen.value = true
}

const closeTimePicker = () => {
  isTimePickerOpen.value = false
}

const selectTime = (time) => {
  selectedTime.value = time
}

const selectPeriod = (period) => {
  selectedPeriod.value = period
}

const applyTimeSelection = () => {
  // Convert to 24-hour format if PM is selected
  if (selectedPeriod.value === 'PM') {
    const [hours, minutes] = selectedTime.value.split(':')
    const hour = parseInt(hours)

    // Only adjust hours that aren't already in PM format (12 PM stays as 12)
    const adjustedHour = hour === 12 ? 12 : hour + 12
    form.time = `${adjustedHour.toString().padStart(2, '0')}:${minutes}`
  } else {
    // For AM, make sure 12 AM becomes 00:00
    const [hours, minutes] = selectedTime.value.split(':')
    const hour = parseInt(hours)
    const adjustedHour = hour === 12 ? 0 : hour
    form.time = `${adjustedHour.toString().padStart(2, '0')}:${minutes}`
  }

  closeTimePicker()
}

// Date picker variables
const isDatePickerOpen = ref(false)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const selectedDate = ref(new Date())
const tempSelectedDate = ref(null)

// Custom time input variables
const customHours = ref('07')
const customMinutes = ref('00')

// Define weekdays and month names for the calendar
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Format time inputs when focus is lost
const formatTimeInputs = () => {
  // Validate and format hours
  let formattedHours = parseInt(customHours.value) || 1
  if (formattedHours < 1) formattedHours = 1
  if (formattedHours > 12) formattedHours = 12

  // Validate and format minutes
  let formattedMinutes = parseInt(customMinutes.value) || 0
  if (formattedMinutes < 0) formattedMinutes = 0
  if (formattedMinutes > 59) formattedMinutes = 59

  // Update the ref values with formatted strings
  customHours.value = formattedHours.toString().padStart(2, '0')
  customMinutes.value = formattedMinutes.toString().padStart(2, '0')

  // Update selectedTime with formatted values
  selectedTime.value = `${formattedHours.toString().padStart(2, '0')}:${formattedMinutes.toString().padStart(2, '0')}`
}

// Function to prefill the form with test data
const prefillForm = () => {
  // Generate a random event title to avoid duplicates
  const eventTypes = [
    'Workshop',
    'Conference',
    'Meetup',
    'Concert',
    'Festival',
    'Webinar',
    'Hackathon',
  ]
}
</script>

<template>
  <div class="create-event">
    <div class="container">
      <router-link to="/" class="back-link">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>BACK</span>
      </router-link>

      <div class="create-event__header">
        <h1 class="create-event__title">Make Your Event dYZ%</h1>
        <p class="create-event__subtitle">Fill out this form to create your event - it's easy!</p>
        <button type="button" @click="prefillForm" class="prefill-button">
          Prefill with Test Data
        </button>
      </div>

      <div v-if="error" class="create-event__alert create-event__alert--error">
        {{ error }}
      </div>

      <div v-if="success" class="create-event__alert create-event__alert--success">
        Event created successfully! Redirecting to event page...
      </div>

      <form @submit.prevent="handleSubmit" class="create-event__form">
        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Event Information
          </h2>

          <div class="form-group">
            <label for="title" class="form-label">Event Name</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.title.valid }"
              placeholder="What's your event called?"
            />
            <p v-if="!validation.title.valid" class="form-error">{{ validation.title.message }}</p>
            <p v-else class="form-helper">Name it something people will understand right away</p>
          </div>

          <div class="form-group">
            <label for="organizer" class="form-label">Organizer Name</label>
            <input
              id="organizer"
              v-model="form.organizer"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.organizer.valid }"
              placeholder="Who's hosting this?"
            />
            <p v-if="!validation.organizer.valid" class="form-error">
              {{ validation.organizer.message }}
            </p>
          </div>

          <div class="form-group">
            <label for="category" class="form-label">Event Category</label>
            <select
              id="category"
              v-model="form.category"
              class="form-select"
              :class="{ 'form-input--error': !validation.category.valid }"
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <p v-if="!validation.category.valid" class="form-error">
              {{ validation.category.message }}
            </p>
            <p v-else class="form-helper">The right category helps people find your event</p>
          </div>

          <div class="form-group">
            <label class="form-label">Sub Categories</label>
            <div class="subcategories-display">
              <div class="selected-subcategories">
                <div v-if="displayedSubCategories.length === 0" class="no-subcategories">
                  No subcategories selected
                </div>
                <div
                  v-for="(subCat, index) in displayedSubCategories"
                  :key="index"
                  class="selected-subcategory"
                >
                  <span>{{ getSubCategoryName(subCat) }}</span>
                  <button
                    type="button"
                    @click="removeSubCategoryById(subCat)"
                    class="remove-subcategory-btn"
                    aria-label="Remove subcategory"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="openSubCategoryModal"
                class="manage-subcategories-btn"
                :disabled="form.category === ''"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ displayedSubCategories.length ? 'Edit' : 'Add' }} Subcategories</span>
              </button>
            </div>
            <p v-if="!validation.subCategories.valid" class="form-error">
              {{ validation.subCategories.message }}
            </p>
            <p v-else class="form-helper">
              Add up to 5 subcategories to describe your event better
            </p>
          </div>

          <div class="form-group">
            <label for="description" class="form-label">Event Description</label>
            <textarea
              id="description"
              v-model="form.description"
              class="form-textarea"
              :class="{ 'form-input--error': !validation.description.valid }"
              placeholder="Tell people what makes your event special..."
              rows="5"
            ></textarea>
            <p v-if="!validation.description.valid" class="form-error">
              {{ validation.description.message }}
            </p>
            <p v-else class="form-helper">Tell people what will happen at your event</p>
          </div>

          <div class="form-group">
            <label class="form-label">Event Images</label>
            <div class="image-upload-container">
              <div class="image-upload-row">
                <div
                  class="image-upload-dropzone"
                  :class="{ 'has-image': mainImagePreview }"
                  @click="triggerMainImageUpload"
                  @dragover.prevent
                  @drop.prevent="handleMainImageDrop"
                >
                  <img
                    v-if="mainImagePreview"
                    :src="mainImagePreview"
                    alt="Main image preview"
                    class="preview-image"
                  />
                  <div v-if="mainImagePreview" class="image-overlay">
                    <button type="button" class="remove-image-btn" @click.stop="removeMainImage">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <div class="upload-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M3 16L7 12C7.94 11.06 9.44 11.06 10.38 12L16.5 18"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M14 16L16 14C16.94 13.06 18.44 13.06 19.38 14L21 15.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <circle cx="9" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                    <div class="upload-text">
                      <span class="primary-text">Main Event Image</span>
                      <span class="secondary-text">Drag & drop or click to upload</span>
                    </div>
                  </div>
                </div>

                <div
                  class="image-upload-dropzone banner-dropzone"
                  :class="{ 'has-image': bannerImagePreview }"
                  @click="triggerBannerImageUpload"
                  @dragover.prevent
                  @drop.prevent="handleBannerImageDrop"
                >
                  <img
                    v-if="bannerImagePreview"
                    :src="bannerImagePreview"
                    alt="Banner image preview"
                    class="preview-image"
                  />
                  <div v-if="bannerImagePreview" class="image-overlay">
                    <button type="button" class="remove-image-btn" @click.stop="removeBannerImage">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M6 6L18 18"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <div class="upload-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="2"
                          y="4"
                          width="20"
                          height="13"
                          rx="2"
                          stroke="currentColor"
                          stroke-width="1.5"
                        />
                        <path
                          d="M2 13L6 9C6.94 8.06 8.44 8.06 9.38 9L15.5 15"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <path
                          d="M14 13L16 11C16.94 10.06 18.44 10.06 19.38 11L22 13.5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />
                        <circle cx="8" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </div>
                    <div class="upload-text">
                      <span class="primary-text">Banner Image</span>
                      <span class="secondary-text">Drag & drop or click to upload</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="image-inputs">
                <input
                  id="mainImage"
                  ref="mainImageInput"
                  type="file"
                  class="image-input"
                  accept="image/*"
                  @change="handleMainImageUpload"
                />
                <input
                  id="bannerImage"
                  ref="bannerImageInput"
                  type="file"
                  class="image-input"
                  accept="image/*"
                  @change="handleBannerImageUpload"
                />
              </div>
            </div>
            <p
              v-if="!validation.mainImage.valid || !validation.bannerImage.valid"
              class="form-error"
            >
              {{
                !validation.mainImage.valid
                  ? validation.mainImage.message
                  : validation.bannerImage.message
              }}
            </p>
            <p v-else class="form-helper">
              Upload images for your event. The main image will appear on cards throughout the site,
              while the banner will be displayed on your event's detail page.
            </p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Date & Time
          </h2>

          <div class="form-row">
            <div class="form-group">
              <label for="date" class="form-label">Event Date</label>
              <div class="date-picker-wrapper">
                <input
                  id="date"
                  v-model="form.date"
                  type="text"
                  readonly
                  class="form-input date-input"
                  :class="{ 'form-input--error': !validation.date.valid }"
                  :min="today"
                  @click="openDatePicker"
                />
                <div v-if="showDateTip" class="picker-tip">
                  <div class="tip-arrow"></div>
                  <div class="tip-content">
                    <p>Click to open calendar</p>
                    <span>Select a date for your event</span>
                  </div>
                </div>
              </div>
              <p v-if="!validation.date.valid" class="form-error">{{ validation.date.message }}</p>
              <p v-else class="form-helper">Click to open the calendar</p>
            </div>

            <div class="form-group">
              <label for="time" class="form-label">Start Time</label>
              <div class="time-picker-wrapper">
                <input
                  id="time"
                  v-model="form.time"
                  type="text"
                  readonly
                  class="form-input time-input"
                  :class="{ 'form-input--error': !validation.time.valid }"
                  @click="openTimePicker"
                  placeholder="Select a time"
                />
                <div v-if="showTimeTip" class="picker-tip">
                  <div class="tip-arrow"></div>
                  <div class="tip-content">
                    <p>Click to select time</p>
                    <span>Use our easy time selector</span>
                  </div>
                </div>
              </div>
              <p v-if="!validation.time.valid" class="form-error">{{ validation.time.message }}</p>
              <p v-else class="form-helper">Click to open time selector</p>
            </div>
          </div>

          <div class="form-group">
            <label for="duration" class="form-label">Event Duration</label>
            <select id="duration" v-model="form.duration" class="form-select">
              <option value="" disabled>Select duration</option>
              <option v-for="option in durationOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <p class="form-helper">Tell people how long your event will last</p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Location Details
          </h2>

          <div class="form-group">
            <label for="location" class="form-label">Venue Name & Address</label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              class="form-input"
              :class="{ 'form-input--error': !validation.location.valid }"
              placeholder="Where is your event happening?"
            />
            <p v-if="!validation.location.valid" class="form-error">
              {{ validation.location.message }}
            </p>
            <p v-else class="form-helper">Add the full address so people can find your event</p>
          </div>

          <div class="location-map-placeholder">
            <div class="location-map-content">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <p>Maps coming soon</p>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Ticket Information
          </h2>

          <div v-if="!validation.ticketTypes.valid" class="form-error ticket-types-error">
            {{ validation.ticketTypes.message }}
          </div>

          <div class="ticket-types-container">
            <div v-for="(ticket, index) in form.ticketTypes" :key="index" class="ticket-type-card">
              <div class="ticket-type-header">
                <h3 class="ticket-type-title">Ticket #{{ index + 1 }}</h3>
                <div class="ticket-type-actions">
                  <button
                    type="button"
                    @click="duplicateTicketType(index)"
                    class="ticket-action-btn ticket-action-duplicate"
                    title="Duplicate ticket"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="removeTicketType(index)"
                    class="ticket-action-btn ticket-action-remove"
                    title="Remove ticket"
                    :disabled="form.ticketTypes.length <= 1"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label :for="'ticket-name-' + index" class="form-label">Ticket Name</label>
                <div class="ticket-name-input-wrapper">
                  <input
                    :id="'ticket-name-' + index"
                    v-model="ticket.name"
                    type="text"
                    class="form-input"
                    placeholder="e.g. Early Bird, VIP, General Admission"
                  />
                  <div class="ticket-template-dropdown">
                    <button
                      type="button"
                      class="ticket-template-btn"
                      @click="openTemplateModal(index)"
                    >
                      <span>Templates</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 9L12 15L18 9"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <div class="ticket-template-options">
                      <button
                        v-for="template in ticketTemplates"
                        :key="template.name"
                        type="button"
                        class="ticket-template-option"
                        @click="applyTemplate(index, template)"
                      >
                        {{ template.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label :for="'ticket-price-' + index" class="form-label">Price ($)</label>
                  <input
                    :id="'ticket-price-' + index"
                    v-model.number="ticket.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div class="form-group">
                  <label :for="'ticket-quantity-' + index" class="form-label">Quantity</label>
                  <input
                    :id="'ticket-quantity-' + index"
                    v-model.number="ticket.quantity"
                    type="number"
                    min="1"
                    class="form-input"
                    placeholder="10"
                  />
                </div>
              </div>

              <div class="form-group">
                <label :for="'ticket-description-' + index" class="form-label"
                  >Description (Optional)</label
                >
                <textarea
                  :id="'ticket-description-' + index"
                  v-model="ticket.description"
                  class="form-textarea ticket-description"
                  rows="2"
                  placeholder="Describe what's included with this ticket"
                ></textarea>
              </div>

              <div class="ticket-sales-period">
                <h4 class="ticket-section-subtitle">Sales End Date</h4>
                <p class="ticket-section-helper">
                  Should this ticket type have a deadline? If yes, tell us when sales should stop.
                  This is optional.
                </p>

                <div class="form-row">
                  <div class="form-group">
                    <label :for="'ticket-end-date-' + index" class="form-label">Date</label>
                    <input
                      :id="'ticket-end-date-' + index"
                      v-model="ticket.salesEndDate"
                      type="date"
                      class="form-input"
                      :min="today"
                      :max="form.date"
                    />
                  </div>

                  <div class="form-group">
                    <label :for="'ticket-end-time-' + index" class="form-label">Time</label>
                    <input
                      :id="'ticket-end-time-' + index"
                      v-model="ticket.salesEndTime"
                      type="time"
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <div class="form-checkbox-wrapper">
                <input
                  :id="'ticket-featured-' + index"
                  v-model="ticket.isFeatured"
                  type="checkbox"
                  class="form-checkbox"
                />
                <label :for="'ticket-featured-' + index" class="form-checkbox-label">
                  Feature this ticket (highlighted in the ticket selection)
                </label>
              </div>
            </div>

            <button type="button" @click="addTicketType" class="add-ticket-type-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Add Another Ticket Type</span>
            </button>
          </div>
        </div>

        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Event Options
          </h2>

          <p class="section-intro">
            Select features and amenities that your event offers to help attendees know what to
            expect.
          </p>

          <div class="event-options-container">
            <div class="event-options-grid">
              <!-- Predefined event options -->
              <div
                v-for="option in predefinedEventOptions"
                :key="'predefined-' + option"
                class="event-option-item"
                @click="toggleEventOption(option)"
              >
                <div
                  class="event-option-checkbox"
                  :class="{ 'event-option-checkbox--selected': isEventOptionSelected(option) }"
                >
                  <div class="event-option-label">{{ option }}</div>
                  <svg
                    v-if="isEventOptionSelected(option)"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="event-option-checkmark"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <!-- Custom event options -->
              <div
                v-for="(option, index) in form.customEventOptions"
                :key="'custom-' + index"
                class="event-option-item"
              >
                <div class="event-option-checkbox event-option-checkbox--selected">
                  <div class="event-option-label">{{ option }}</div>
                  <button
                    type="button"
                    @click="removeCustomEventOption(index)"
                    class="remove-option-btn"
                    aria-label="Remove option"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="add-event-option">
              <div class="custom-event-option-input">
                <input
                  type="text"
                  v-model="newCustomEventOption"
                  placeholder="Add your own event option..."
                  class="form-input custom-option-input"
                  @keyup.enter="addCustomEventOption"
                />
                <button
                  type="button"
                  class="add-custom-option-btn"
                  @click="addCustomEventOption"
                  :disabled="!newCustomEventOption.trim()"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div class="form-checkbox-wrapper mt-4">
            <input id="featured" v-model="form.featured" type="checkbox" class="form-checkbox" />
            <label for="featured" class="form-checkbox-label">
              Feature this event (additional promotion fee may apply)
            </label>
          </div>
          <p class="form-helper">Featured events show up on the homepage</p>
        </div>

        <!-- Add new FAQ section -->
        <div class="form-section">
          <h2 class="section-title">
            <span class="diamond"></span>
            Frequently Asked Questions
            <span class="section-optional">(Optional)</span>
          </h2>

          <p class="section-intro">
            Help attendees by answering common questions about your event. You can edit these
            defaults or add your own.
          </p>

          <div class="faq-container">
            <div v-for="(faq, index) in form.faqs" :key="index" class="faq-item">
              <div class="faq-header">
                <h3 class="faq-number">Q{{ index + 1 }}</h3>
                <div class="faq-actions">
                  <button
                    type="button"
                    @click="removeFaq(index)"
                    class="faq-action-btn faq-action-remove"
                    title="Remove question"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="faq-content">
                <div class="form-group">
                  <label :for="'faq-question-' + index" class="form-label">Question</label>
                  <input
                    :id="'faq-question-' + index"
                    v-model="faq.question"
                    type="text"
                    class="form-input"
                    placeholder="Enter a question guests might ask"
                  />
                </div>

                <div class="form-group">
                  <label :for="'faq-answer-' + index" class="form-label">Answer</label>
                  <textarea
                    :id="'faq-answer-' + index"
                    v-model="faq.answer"
                    class="form-textarea faq-answer"
                    rows="3"
                    placeholder="Provide a clear answer to the question"
                  ></textarea>
                </div>
              </div>
            </div>

            <button type="button" @click="addFaq" class="add-faq-btn">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Add Another Question</span>
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="resetForm" class="btn-secondary" :disabled="isSubmitting">
            Reset Form
          </button>
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            <span v-if="isSubmitting">
              <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="none" stroke-width="3" />
              </svg>
              Creating Event...
            </span>
            <span v-else>Create Event</span>
          </button>
        </div>
      </form>

      <div class="create-event__note">
        <p>
          <strong>Note:</strong> Your event data is saved locally for now. Online saving coming
          soon.
        </p>
      </div>
    </div>

    <div
      v-if="showTemplateModal"
      class="ticket-template-modal-overlay"
      @click.self="closeTemplateModal"
    >
      <div class="ticket-template-modal">
        <div class="ticket-template-modal-header">
          <h3>Choose a Ticket Template</h3>
          <button @click="closeTemplateModal" class="modal-close-btn" aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="ticket-template-modal-body">
          <div
            v-for="template in ticketTemplates"
            :key="template.name"
            class="template-card"
            @click="applyTemplateFromModal(activeTicketIndex, template)"
          >
            <div class="template-card-content">
              <h4 class="template-name">{{ template.name }}</h4>
              <p class="template-description">{{ template.description }}</p>
            </div>
            <div class="template-card-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add subcategory modal -->
    <div
      v-if="showSubCategoryModal"
      class="subcategory-modal-overlay"
      @click.self="closeSubCategoryModal"
    >
      <div class="subcategory-modal">
        <div class="subcategory-modal-header">
          <h3>Select or Add Subcategories</h3>
          <button @click="closeSubCategoryModal" class="modal-close-btn" aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="subcategory-modal-body">
          <p class="subcategory-modal-info">Select up to 5 subcategories or add your own</p>

          <div class="subcategory-search">
            <input
              type="text"
              v-model="subcategorySearchTerm"
              placeholder="Search subcategories..."
              class="subcategory-search-input"
            />
          </div>

          <div class="subcategory-options">
            <div class="subcategory-section">
              <h4 class="subcategory-section-title">Available Subcategories</h4>
              <div class="subcategory-chips">
                <div
                  v-for="subCategory in filteredSubCategories"
                  :key="subCategory.id"
                  class="subcategory-chip"
                  :class="{ 'subcategory-chip--selected': isSubCategorySelected(subCategory.id) }"
                  @click="toggleSubCategory(subCategory.id)"
                >
                  <span>{{ subCategory.name }}</span>
                  <svg
                    v-if="isSubCategorySelected(subCategory.id)"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="subcategory-section">
              <h4 class="subcategory-section-title">Custom Subcategories</h4>
              <div class="custom-subcategory-input">
                <input
                  type="text"
                  v-model="newCustomSubCategory"
                  placeholder="Enter your own subcategory..."
                  class="form-input custom-input"
                  @keyup.enter="addCustomSubCategory"
                />
                <button
                  type="button"
                  class="add-custom-btn"
                  @click="addCustomSubCategory"
                  :disabled="!newCustomSubCategory.trim()"
                >
                  Add
                </button>
              </div>

              <div class="subcategory-chips custom-chips">
                <div
                  v-for="(custom, index) in customSubCategories"
                  :key="'custom-' + index"
                  class="subcategory-chip subcategory-chip--custom"
                >
                  <span>{{ custom }}</span>
                  <button
                    class="remove-custom-btn"
                    @click="removeCustomSubCategory(index)"
                    aria-label="Remove"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M6 6L18 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="subcategory-modal-footer">
            <div class="subcategory-summary">
              <span class="subcategory-count">{{ selectedSubCategoriesCount }}/5 selected</span>
            </div>
            <div class="subcategory-actions">
              <button type="button" class="btn-secondary" @click="closeSubCategoryModal">
                Cancel
              </button>
              <button type="button" class="btn-primary" @click="confirmSubCategories">Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Time Picker Modal -->
    <div v-if="isTimePickerOpen" class="time-picker-overlay" @click.self="closeTimePicker">
      <div class="time-picker-modal">
        <div class="time-picker-header">
          <h3>Select Time</h3>
          <button type="button" class="time-picker-close" @click="closeTimePicker">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="time-picker-body">
          <!-- Custom time input -->
          <div class="custom-time-input">
            <div class="time-input-group">
              <input
                type="text"
                v-model="customHours"
                class="time-input-field"
                maxlength="2"
                @focus="$event.target.select()"
                @blur="formatTimeInputs"
                @keydown="handleTimeInput"
                placeholder="HH"
              />
              <span class="time-divider">:</span>
              <input
                type="text"
                v-model="customMinutes"
                class="time-input-field"
                maxlength="2"
                @focus="$event.target.select()"
                @blur="formatTimeInputs"
                @keydown="handleTimeInput"
                placeholder="MM"
              />
            </div>
          </div>

          <div class="time-picker-grid">
            <div
              v-for="time in timeOptions"
              :key="time"
              class="time-option"
              :class="{ selected: selectedTime === time }"
              @click="selectTime(time)"
            >
              {{ time }}
            </div>
          </div>
          <div class="time-period-selector">
            <button
              type="button"
              class="time-period-btn"
              :class="{ selected: selectedPeriod === 'AM' }"
              @click="selectPeriod('AM')"
            >
              AM
            </button>
            <button
              type="button"
              class="time-period-btn"
              :class="{ selected: selectedPeriod === 'PM' }"
              @click="selectPeriod('PM')"
            >
              PM
            </button>
          </div>
        </div>
        <div class="time-picker-actions">
          <button type="button" class="time-picker-btn time-picker-cancel" @click="closeTimePicker">
            Cancel
          </button>
          <button
            type="button"
            class="time-picker-btn time-picker-apply"
            @click="applyTimeSelection"
          >
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Custom Date Picker Modal -->
    <div v-if="isDatePickerOpen" class="date-picker-overlay" @click.self="closeDatePicker">
      <div class="date-picker-modal">
        <div class="date-picker-header">
          <h3>Select Date</h3>
          <button type="button" class="date-picker-close" @click="closeDatePicker">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="date-picker-body">
          <div class="date-picker-month-nav">
            <button class="month-nav-btn" @click="previousMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <div class="month-display">{{ monthNames[currentMonth] }} {{ currentYear }}</div>
            <button class="month-nav-btn" @click="nextMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div class="date-picker-weekdays">
            <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          </div>

          <div class="date-picker-days">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': !day.inCurrentMonth,
                today: day.isToday,
                selected: day.isSelected,
                disabled: day.isDisabled,
              }"
              @click="!day.isDisabled && selectDate(day.date)"
            >
              {{ day.day }}
            </div>
          </div>
        </div>
        <div class="date-picker-actions">
          <button type="button" class="date-picker-btn date-picker-cancel" @click="closeDatePicker">
            Cancel
          </button>
          <button
            type="button"
            class="date-picker-btn date-picker-apply"
            @click="applyDateSelection"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/events'

// Initialize references
const router = useRouter()
const eventStore = useEventStore()
const error = ref(null)
const success = ref(false)
const isSubmitting = ref(false)
const today = ref(new Date().toISOString().split('T')[0]) // Today's date in YYYY-MM-DD format
const showTemplateModal = ref(false)
const activeTicketIndex = ref(0)
const showSubCategoryModal = ref(false)
const tempSelectedSubCategories = ref([]) // Temporary storage for selected subcategories in modal
const subCategorySearchTerm = ref('')
const customSubCategories = ref([])
const newCustomSubCategory = ref('')
const categories = ref([])
const availableSubCategories = ref([])
const mainImagePreview = ref(null)
const bannerImagePreview = ref(null)
const newCustomEventOption = ref('')

// Also initialize form with image fields
const form = reactive({
  title: '',
  description: '',
  category: '',
  subCategories: [],
  date: '',
  time: '19:00',
  location: '',
  price: 0,
  totalTickets: 100,
  organizer: '',
  duration: '',
  featured: false,
  imageIndex: Math.floor(Math.random() * 4), // Random image from available set
  mainImage: null,
  bannerImage: null,
  selectedEventOptions: [], // Start with no options selected
  customEventOptions: [], // For user-added custom options
  ticketTypes: [
    {
      name: 'General Admission',
      price: 0,
      quantity: 100,
      description: '',
      salesEndDate: '',
      salesEndTime: '23:59',
      isFeatured: false,
    },
  ],
  // Add FAQs to the form data
  faqs: [
    {
      question: "What's included in the ticket price?",
      answer:
        'Your ticket includes entry to the event, access to all scheduled activities, and any materials needed for workshops. Food and drinks may be available for purchase separately.',
    },
    {
      question: "What's the refund policy?",
      answer:
        'Tickets can be refunded up to 7 days before the event. After that, no refunds will be issued, but tickets are transferable to another person.',
    },
    {
      question: 'Is there parking available?',
      answer:
        'Limited parking is available at the venue. We recommend using public transportation or rideshare services if possible.',
    },
    {
      question: 'What should I bring with me?',
      answer:
        'Please bring your ticket (digital or printed), a valid ID, and any personal items you might need. Comfortable attire is recommended.',
    },
    {
      question: 'Are there age restrictions for this event?',
      answer:
        'This event is open to attendees of all ages. Children under 12 must be accompanied by an adult.',
    },
  ],
})

// Form validation
const validation = reactive({
  title: { valid: true, message: '' },
  description: { valid: true, message: '' },
  category: { valid: true, message: '' },
  subCategories: { valid: true, message: '' },
  date: { valid: true, message: '' },
  time: { valid: true, message: '' },
  location: { valid: true, message: '' },
  price: { valid: true, message: '' },
  totalTickets: { valid: true, message: '' },
  organizer: { valid: true, message: '' },
  ticketTypes: { valid: true, message: '' },
  mainImage: { valid: true, message: '' },
  bannerImage: { valid: true, message: '' },
})

// Fetch categories on mount
onMounted(async () => {
  try {
    // This will be replaced with API call later
    const eventService = (await import('@/services/eventService')).default
    categories.value = await eventService.getAllCategories()

    // Get sub-categories or initialize with mock data if the service doesn't provide them
    try {
      availableSubCategories.value = await eventService.getAllSubCategories()
    } catch {
      // If the service doesn't have getAllSubCategories method yet, use mock data
      availableSubCategories.value = [
        { id: 'sub1', name: 'Workshop' },
        { id: 'sub2', name: 'Conference' },
        { id: 'sub3', name: 'Meetup' },
        { id: 'sub4', name: 'Webinar' },
        { id: 'sub5', name: 'Party' },
        { id: 'sub6', name: 'Exhibition' },
        { id: 'sub7', name: 'Concert' },
        { id: 'sub8', name: 'Sport Event' },
      ]
    }
  } catch (err) {
    error.value = 'Failed to load categories'
    console.error('Error loading categories:', err)
  }
})

// Add ticket type
const addTicketType = () => {
  form.ticketTypes.push({
    name: '',
    price: 0,
    quantity: 50,
    description: '',
    salesEndDate: '',
    salesEndTime: '23:59',
    isFeatured: false,
  })
}

// Remove ticket type
const removeTicketType = (index) => {
  form.ticketTypes.splice(index, 1)
}

// Duplicate ticket type
const duplicateTicketType = (index) => {
  const ticketToDuplicate = { ...form.ticketTypes[index] }
  ticketToDuplicate.name = `${ticketToDuplicate.name} (Copy)`
  form.ticketTypes.splice(index + 1, 0, ticketToDuplicate)
}

// Available ticket type templates
const ticketTemplates = [
  { name: 'Standard', description: 'Regular entry ticket for most guests', isFeatured: false },
  { name: 'Early Bird', description: 'Limited time offer at a discounted price', isFeatured: true },
  { name: 'VIP', description: 'Premium experience with exclusive benefits', isFeatured: true },
  { name: 'Table for 4', description: 'Reserved table seating for 4 guests' },
  { name: 'Table for 8', description: 'Reserved table seating for 8 guests' },
  { name: 'Table for 12', description: 'Reserved table seating for a large group of 12' },
  {
    name: 'Gold',
    description: 'Elite experience with exclusive perks and priority service',
    isFeatured: true,
  },
  { name: 'Student', description: 'Discounted ticket with valid student ID' },
  { name: 'Group (5+)', description: 'Discounted rate for groups of 5 or more' },
]

// Apply template to ticket
const applyTemplate = (index, template) => {
  form.ticketTypes[index].name = template.name
  form.ticketTypes[index].description = template.description
  if (template.isFeatured) {
    form.ticketTypes[index].isFeatured = true
  }
}

// Calculate total tickets
const calculateTotalTickets = computed(() => {
  return form.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)
})

// Update total tickets when ticket quantities change
watch(calculateTotalTickets, (newTotal) => {
  form.totalTickets = newTotal
})

// Computed combined date and time
const fullDateTime = computed(() => {
  if (!form.date || !form.time) return null
  const [year, month, day] = form.date.split('-')
  const [hours, minutes] = form.time.split(':')
  return new Date(year, month - 1, day, hours, minutes).toISOString()
})

// Duration options
const durationOptions = [
  '1 hour',
  '2 hours',
  '3 hours',
  '4 hours',
  '5 hours',
  '1 day',
  '2 days',
  '3 days',
  'Multiple days',
]

// Define stronger password regex if using authentication
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  // Basic sanitization - replaces potentially harmful characters
  return input.replace(/[<>&"'`=/]/g, '')
}

// Validate form with enhanced security
const validateForm = () => {
  let isValid = true

  // Title validation with sanitization
  const sanitizedTitle = sanitizeInput(form.title.trim())
  if (!sanitizedTitle) {
    validation.title.valid = false
    validation.title.message = 'Add a name for your event'
    isValid = false
  } else if (sanitizedTitle.length < 5) {
    validation.title.valid = false
    validation.title.message = 'Name needs at least 5 letters'
    isValid = false
  } else if (sanitizedTitle.length > 100) {
    validation.title.valid = false
    validation.title.message = 'Name is too long (100 letters max)'
    isValid = false
  } else {
    validation.title.valid = true
    // Update the form with sanitized value
    form.title = sanitizedTitle
  }

  // Description validation with sanitization
  const sanitizedDescription = sanitizeInput(form.description.trim())
  if (!sanitizedDescription) {
    validation.description.valid = false
    validation.description.message = 'Add a description'
    isValid = false
  } else if (sanitizedDescription.length < 20) {
    validation.description.valid = false
    validation.description.message = 'Write at least 20 letters'
    isValid = false
  } else if (sanitizedDescription.length > 5000) {
    validation.description.valid = false
    validation.description.message = 'Too long! Keep it under 5000 letters'
    isValid = false
  } else {
    validation.description.valid = true
    // Update the form with sanitized value
    form.description = sanitizedDescription
  }

  // Category validation
  if (!form.category) {
    validation.category.valid = false
    validation.category.message = 'Pick a category'
    isValid = false
  } else {
    // Validate category ID exists in valid categories
    const categoryExists = categories.value.some((cat) => cat.id === form.category)
    if (!categoryExists) {
      validation.category.valid = false
      validation.category.message = 'Pick a category from the list'
      isValid = false
    } else {
      validation.category.valid = true
    }
  }

  // Sub-categories validation
  const nonEmptySubCategories = form.subCategories.filter((cat) => cat !== '')
  const uniqueSubCategories = [...new Set(nonEmptySubCategories)]

  if (nonEmptySubCategories.length !== uniqueSubCategories.length) {
    validation.subCategories.valid = false
    validation.subCategories.message = 'You picked the same tag twice'
    isValid = false
  } else {
    // Validate each subcategory ID exists in valid subcategories
    const invalidSubCat = nonEmptySubCategories.some(
      (subCat) => !availableSubCategories.value.some((validSubCat) => validSubCat.id === subCat),
    )

    if (invalidSubCat) {
      validation.subCategories.valid = false
      validation.subCategories.message = 'Pick tags from the list'
      isValid = false
    } else {
      validation.subCategories.valid = true
    }
  }

  // Date validation
  if (!form.date) {
    validation.date.valid = false
    validation.date.message = 'Pick a date'
    isValid = false
  } else {
    // Validate date format and ensure it's not in the past
    const selectedDate = new Date(form.date)
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    if (isNaN(selectedDate.getTime())) {
      validation.date.valid = false
      validation.date.message = "This date won't work"
      isValid = false
    } else if (selectedDate < currentDate) {
      validation.date.valid = false
      validation.date.message = 'Pick a date in the future'
      isValid = false
    } else {
      validation.date.valid = true
    }
  }

  // Time validation
  if (!form.time) {
    validation.time.valid = false
    validation.time.message = 'Add a start time'
    isValid = false
  } else {
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(form.time)) {
      validation.time.valid = false
      validation.time.message = 'Use hours:minutes format'
      isValid = false
    } else {
      validation.time.valid = true
    }
  }

  // Location validation with sanitization
  const sanitizedLocation = sanitizeInput(form.location.trim())
  if (!sanitizedLocation) {
    validation.location.valid = false
    validation.location.message = 'Add a location'
    isValid = false
  } else if (sanitizedLocation.length < 5) {
    validation.location.valid = false
    validation.location.message = 'Write a longer address'
    isValid = false
  } else {
    validation.location.valid = true
    // Update the form with sanitized value
    form.location = sanitizedLocation
  }

  // Price validation
  if (isNaN(form.price) || form.price === '') {
    validation.price.valid = false
    validation.price.message = 'Price must be a number'
    isValid = false
  } else {
    const price = parseFloat(form.price)
    if (price < 0) {
      validation.price.valid = false
      validation.price.message = "Price can't be negative"
      isValid = false
    } else if (price > 100000) {
      validation.price.valid = false
      validation.price.message = 'Price too high (max $100,000)'
      isValid = false
    } else {
      validation.price.valid = true
      // Ensure price is stored as a number with 2 decimal places
      form.price = parseFloat(price.toFixed(2))
    }
  }

  // Tickets validation
  if (isNaN(form.totalTickets) || form.totalTickets === '') {
    validation.totalTickets.valid = false
    validation.totalTickets.message = 'How many tickets?'
    isValid = false
  } else {
    const tickets = parseInt(form.totalTickets)
    if (tickets <= 0) {
      validation.totalTickets.valid = false
      validation.totalTickets.message = 'You need at least 1 ticket'
      isValid = false
    } else if (tickets > 100000) {
      validation.totalTickets.valid = false
      validation.totalTickets.message = 'Too many tickets (max 100,000)'
      isValid = false
    } else {
      validation.totalTickets.valid = true
      // Ensure tickets is stored as an integer
      form.totalTickets = tickets
    }
  }

  // Organizer validation with sanitization
  const sanitizedOrganizer = sanitizeInput(form.organizer.trim())
  if (!sanitizedOrganizer) {
    validation.organizer.valid = false
    validation.organizer.message = 'Add your name or group name'
    isValid = false
  } else {
    validation.organizer.valid = true
    // Update the form with sanitized value
    form.organizer = sanitizedOrganizer
  }

  // Ticket types validation
  if (form.ticketTypes.length === 0) {
    validation.ticketTypes.valid = false
    validation.ticketTypes.message = 'Add at least one ticket type'
    isValid = false
  } else {
    let ticketTypeValid = true
    form.ticketTypes.forEach((ticket, index) => {
      const sanitizedName = sanitizeInput(ticket.name.trim())
      if (!sanitizedName) {
        validation.ticketTypes.valid = false
        validation.ticketTypes.message = `Ticket #${index + 1} needs a name`
        ticketTypeValid = false
        isValid = false
      }

      if (ticket.quantity <= 0) {
        validation.ticketTypes.valid = false
        validation.ticketTypes.message = `Ticket #${index + 1} needs at least 1`
        ticketTypeValid = false
        isValid = false
      }

      if (ticket.salesEndDate) {
        const endDate = new Date(ticket.salesEndDate)
        const eventDate = new Date(form.date)

        if (isNaN(endDate.getTime())) {
          validation.ticketTypes.valid = false
          validation.ticketTypes.message = `Ticket #${index + 1} has a bad date`
          ticketTypeValid = false
          isValid = false
        } else if (endDate > eventDate) {
          validation.ticketTypes.valid = false
          validation.ticketTypes.message = `Ticket #${index + 1} must stop selling before event starts`
          ticketTypeValid = false
          isValid = false
        }
      }
    })

    if (ticketTypeValid) {
      validation.ticketTypes.valid = true
    }
  }

  // Main image validation
  if (!form.mainImage) {
    validation.mainImage.valid = false
    validation.mainImage.message = 'Upload a main image'
    isValid = false
  }

  // Banner image validation
  if (!form.bannerImage) {
    validation.bannerImage.valid = false
    validation.bannerImage.message = 'Upload a banner image'
    isValid = false
  }

  return isValid
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    // Scroll to first error
    const firstError = Object.keys(validation).find((key) => !validation[key].valid)
    if (firstError) {
      const element = document.getElementById(firstError)
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    // Filter out empty sub-categories and combine with custom subcategories
    const validSubCategories = [
      ...form.subCategories.filter((cat) => cat !== ''),
      ...customSubCategories.value,
    ]

    // Process ticket types
    const processedTickets = form.ticketTypes.map((ticket) => ({
      ...ticket,
      price: parseFloat(ticket.price),
      quantity: parseInt(ticket.quantity),
      name: sanitizeInput(ticket.name.trim()),
      description: sanitizeInput(ticket.description.trim()),
    }))

    // Process images - convert File objects to data URLs
    let mainImageUrl = mainImagePreview.value
    let bannerImageUrl = bannerImagePreview.value

    // Get the selected event options
    const selectedEventOptions = [...form.selectedEventOptions, ...form.customEventOptions].filter(
      Boolean,
    ) // Remove any falsy values

    // Prepare the event data
    const eventData = {
      title: form.title,
      description: form.description,
      category: form.category,
      subCategories: validSubCategories,
      date: fullDateTime.value,
      location: form.location,
      price: parseFloat(form.price),
      totalTickets: parseInt(form.totalTickets),
      organizer: form.organizer,
      duration: form.duration,
      featured: form.featured,
      imageIndex: form.imageIndex,
      mainImage: mainImageUrl,
      bannerImage: bannerImageUrl,
      eventOptions: selectedEventOptions, // Add event options to the event data
      selectedEventOptions: form.selectedEventOptions, // Store the original selected options
      customEventOptions: form.customEventOptions, // Store the custom options
      ticketTypes: processedTickets,
      faqs: form.faqs.filter((faq) => faq.question.trim() && faq.answer.trim()), // Only include FAQs with content
    }

    // Create the event
    const newEvent = await eventStore.createEvent(eventData)

    success.value = true

    // Redirect to the event page after a brief delay
    setTimeout(() => {
      router.push({ path: `/event/${newEvent.id}` })
    }, 2000)
  } catch (err) {
    error.value = err.message || 'Failed to create event'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}

// Reset form
const resetForm = () => {
  Object.keys(form).forEach((key) => {
    if (key === 'price') {
      form[key] = 0
    } else if (key === 'totalTickets') {
      form[key] = 100
    } else if (key === 'featured') {
      form[key] = false
    } else if (key === 'imageIndex') {
      form[key] = Math.floor(Math.random() * 4)
    } else if (key === 'time') {
      form[key] = '19:00'
    } else if (key === 'subCategories') {
      form[key] = []
    } else if (key === 'ticketTypes') {
      form[key] = [
        {
          name: 'General Admission',
          price: 0,
          quantity: 100,
          description: '',
          salesEndDate: '',
          salesEndTime: '23:59',
          isFeatured: false,
        },
      ]
    } else {
      form[key] = ''
    }
  })

  Object.keys(validation).forEach((key) => {
    validation[key].valid = true
    validation[key].message = ''
  })

  error.value = null
  success.value = false

  // Also reset custom subcategories
  customSubCategories.value = []

  // Reset custom event options
  form.customEventOptions = []

  // Reset event options to defaults
  form.selectedEventOptions = ['Live performance', 'Food & drinks available', 'Indoor event']

  // Reset FAQs to defaults
  form.faqs = [
    {
      question: "What's included in the ticket price?",
      answer:
        'Your ticket includes entry to the event, access to all scheduled activities, and any materials needed for workshops. Food and drinks may be available for purchase separately.',
    },
    {
      question: "What's the refund policy?",
      answer:
        'Tickets can be refunded up to 7 days before the event. After that, no refunds will be issued, but tickets are transferable to another person.',
    },
    {
      question: 'Is there parking available?',
      answer:
        'Limited parking is available at the venue. We recommend using public transportation or rideshare services if possible.',
    },
    {
      question: 'What should I bring with me?',
      answer:
        'Please bring your ticket (digital or printed), a valid ID, and any personal items you might need. Comfortable attire is recommended.',
    },
    {
      question: 'Are there age restrictions for this event?',
      answer:
        'This event is open to attendees of all ages. Children under 12 must be accompanied by an adult.',
    },
  ]
}

// Set min date to today for date picker
// const today = new Date().toISOString().split('T')[0]

// Open template modal for a specific ticket
const openTemplateModal = (index) => {
  activeTicketIndex.value = index
  showTemplateModal.value = true
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

// Close template modal
const closeTemplateModal = () => {
  showTemplateModal.value = false
  document.body.style.overflow = '' // Re-enable scrolling
}

// Apply template from modal and close the modal
const applyTemplateFromModal = (index, template) => {
  applyTemplate(index, template)
  closeTemplateModal()
}

// Add FAQ
const addFaq = () => {
  form.faqs.push({
    question: '',
    answer: '',
  })
}

// Remove FAQ
const removeFaq = (index) => {
  form.faqs.splice(index, 1)
}

// Handle main image upload
const handleMainImageUpload = (event) => {
  let file

  // Check if it's a drop event
  if (event.dataTransfer) {
    file = event.dataTransfer.files[0]
  } else if (event.target.files) {
    file = event.target.files[0]
  }

  if (file) {
    form.mainImage = file
    validation.mainImage.valid = true

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      mainImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Handle banner image upload
const handleBannerImageUpload = (event) => {
  let file

  // Check if it's a drop event
  if (event.dataTransfer) {
    file = event.dataTransfer.files[0]
  } else if (event.target.files) {
    file = event.target.files[0]
  }

  if (file) {
    form.bannerImage = file
    validation.bannerImage.valid = true

    // Create a preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      bannerImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Remove main image - could be added to the UI if needed
const removeMainImage = () => {
  form.mainImage = null
  mainImagePreview.value = null
  validation.mainImage.valid = false
  validation.mainImage.message = 'Please upload a main image'
}

// Remove banner image - could be added to the UI if needed
const removeBannerImage = () => {
  form.bannerImage = null
  bannerImagePreview.value = null
  validation.bannerImage.valid = false
  validation.bannerImage.message = 'Please upload a banner image'
}

// Trigger main image upload
const triggerMainImageUpload = () => {
  const input = document.getElementById('mainImage')
  input.click()
}

// Trigger banner image upload
const triggerBannerImageUpload = () => {
  const input = document.getElementById('bannerImage')
  input.click()
}

// Add custom subcategory
const addCustomSubCategory = () => {
  const trimmed = newCustomSubCategory.value.trim()
  if (
    trimmed &&
    customSubCategories.value.length < 5 &&
    !customSubCategories.value.includes(trimmed)
  ) {
    customSubCategories.value.push(trimmed)
    newCustomSubCategory.value = ''
  }
}

// Remove custom subcategory
const removeCustomSubCategory = (index) => {
  customSubCategories.value.splice(index, 1)
}

// Get all displayed subcategories (selected + custom)
const displayedSubCategories = computed(() => {
  return [...form.subCategories, ...customSubCategories.value]
})

// Get subcategory name by id
const getSubCategoryName = (subCatId) => {
  // If it's a predefined subcategory
  if (typeof subCatId === 'string' && subCatId.startsWith('sub')) {
    const subCat = availableSubCategories.value.find((sc) => sc.id === subCatId)
    return subCat ? subCat.name : subCatId
  }
  // If it's a custom subcategory
  return subCatId
}

// Filter subcategories based on search term
const filteredSubCategories = computed(() => {
  if (!subCategorySearchTerm.value) return availableSubCategories.value

  const searchTerm = subCategorySearchTerm.value.toLowerCase()
  return availableSubCategories.value.filter((sc) => sc.name.toLowerCase().includes(searchTerm))
})

// Count selected subcategories
const selectedSubCategoriesCount = computed(() => {
  return tempSelectedSubCategories.value.length + customSubCategories.value.length
})

// Remove a subcategory from the form
const removeSubCategoryById = (subCat) => {
  if (typeof subCat === 'string' && subCat.startsWith('sub')) {
    // If it's a predefined subcategory
    form.subCategories = form.subCategories.filter((sc) => sc !== subCat)
  } else {
    // If it's a custom subcategory
    customSubCategories.value = customSubCategories.value.filter((sc) => sc !== subCat)
  }
}

// Toggle subcategory selection
const toggleSubCategory = (id) => {
  if (isSubCategorySelected(id)) {
    tempSelectedSubCategories.value = tempSelectedSubCategories.value.filter(
      (subCatId) => subCatId !== id,
    )
  } else {
    if (selectedSubCategoriesCount.value < 5) {
      tempSelectedSubCategories.value.push(id)
    }
  }
}

// Check if subcategory is selected
const isSubCategorySelected = (id) => {
  return tempSelectedSubCategories.value.includes(id)
}

// Open subcategory modal
const openSubCategoryModal = () => {
  if (form.category === '') {
    validation.category.valid = false
    validation.category.message = 'Select a category first'
    // Focus category dropdown
    const categoryElement = document.getElementById('category')
    if (categoryElement) categoryElement.focus()
    return
  }

  // Initialize the temp selection with current selection
  tempSelectedSubCategories.value = [...form.subCategories]
  showSubCategoryModal.value = true
  document.body.style.overflow = 'hidden' // Prevent background scrolling
}

// Close subcategory modal
const closeSubCategoryModal = () => {
  showSubCategoryModal.value = false
  document.body.style.overflow = '' // Re-enable scrolling
  subCategorySearchTerm.value = ''
  newCustomSubCategory.value = ''
}

// Confirm subcategory selections
const confirmSubCategories = () => {
  form.subCategories = [...tempSelectedSubCategories.value]
  closeSubCategoryModal()
}

// Handle main image drop
const handleMainImageDrop = (event) => {
  event.preventDefault()
  handleMainImageUpload(event)
}

// Handle banner image drop
const handleBannerImageDrop = (event) => {
  event.preventDefault()
  handleBannerImageUpload(event)
}

// Add custom event option
const addCustomEventOption = () => {
  const trimmed = newCustomEventOption.value.trim()
  if (trimmed && form.customEventOptions.length < 5 && !form.customEventOptions.includes(trimmed)) {
    form.customEventOptions.push(trimmed)
    newCustomEventOption.value = ''
  }
}

// Remove custom event option
const removeCustomEventOption = (index) => {
  form.customEventOptions.splice(index, 1)
}

// Toggle event option
const toggleEventOption = (option) => {
  if (form.selectedEventOptions.includes(option)) {
    form.selectedEventOptions = form.selectedEventOptions.filter((opt) => opt !== option)
  } else {
    // Allow selecting more options - remove limit
    form.selectedEventOptions.push(option)
  }
}

// Check if event option is selected
const isEventOptionSelected = (option) => {
  return form.selectedEventOptions.includes(option)
}

// Predefined event options
const predefinedEventOptions = [
  'Live performance',
  'Food & drinks available',
  'Indoor event',
  'Outdoor event',
  'Accessible venue',
  'Family friendly',
  'Free parking',
  'VIP access',
  'Professional networking',
  'Photo opportunities',
  'Live streaming',
  'Q&A session',
  'Merchandise available',
  'Meet & greet',
  'Seating provided',
]

const showDateTip = ref(false)
const showTimeTip = ref(false)

// Time picker variables
const isTimePickerOpen = ref(false)
const selectedTime = ref('07:00')
const selectedPeriod = ref('AM')

const timeOptions = [
  '01:00',
  '01:30',
  '02:00',
  '02:30',
  '03:00',
  '03:30',
  '04:00',
  '04:30',
  '05:00',
  '05:30',
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
]

const openTimePicker = () => {
  // If there's already a time, parse it to 12-hour format for the picker
  if (form.time) {
    const [hours, minutes] = form.time.split(':')
    const hour = parseInt(hours)

    if (hour > 12) {
      // Convert from 24-hour to 12-hour format for PM
      selectedTime.value = `${(hour - 12).toString().padStart(2, '0')}:${minutes}`
      selectedPeriod.value = 'PM'
    } else if (hour === 12) {
      // 12 PM
      selectedTime.value = `12:${minutes}`
      selectedPeriod.value = 'PM'
    } else if (hour === 0) {
      // 12 AM
      selectedTime.value = `12:${minutes}`
      selectedPeriod.value = 'AM'
    } else {
      // Regular AM hours
      selectedTime.value = `${hour.toString().padStart(2, '0')}:${minutes}`
      selectedPeriod.value = 'AM'
    }
  } else {
    // Default to 7:00 AM if no time selected
    selectedTime.value = '07:00'
    selectedPeriod.value = 'AM'
  }

  isTimePickerOpen.value = true
}

const closeTimePicker = () => {
  isTimePickerOpen.value = false
}

const selectTime = (time) => {
  selectedTime.value = time
}

const selectPeriod = (period) => {
  selectedPeriod.value = period
}

const applyTimeSelection = () => {
  // Convert to 24-hour format if PM is selected
  if (selectedPeriod.value === 'PM') {
    const [hours, minutes] = selectedTime.value.split(':')
    const hour = parseInt(hours)

    // Only adjust hours that aren't already in PM format (12 PM stays as 12)
    const adjustedHour = hour === 12 ? 12 : hour + 12
    form.time = `${adjustedHour.toString().padStart(2, '0')}:${minutes}`
  } else {
    // For AM, make sure 12 AM becomes 00:00
    const [hours, minutes] = selectedTime.value.split(':')
    const hour = parseInt(hours)
    const adjustedHour = hour === 12 ? 0 : hour
    form.time = `${adjustedHour.toString().padStart(2, '0')}:${minutes}`
  }

  closeTimePicker()
}

// Date picker variables
const isDatePickerOpen = ref(false)
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const selectedDate = ref(new Date())
const tempSelectedDate = ref(null)

// Custom time input variables
const customHours = ref('07')
const customMinutes = ref('00')

// Define weekdays and month names for the calendar
const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Format time inputs when focus is lost
const formatTimeInputs = () => {
  // Validate and format hours
  let formattedHours = parseInt(customHours.value) || 1
  if (formattedHours < 1) formattedHours = 1
  if (formattedHours > 12) formattedHours = 12

  // Validate and format minutes
  let formattedMinutes = parseInt(customMinutes.value) || 0
  if (formattedMinutes < 0) formattedMinutes = 0
  if (formattedMinutes > 59) formattedMinutes = 59

  // Update the ref values with formatted strings
  customHours.value = formattedHours.toString().padStart(2, '0')
  customMinutes.value = formattedMinutes.toString().padStart(2, '0')

  // Update selectedTime with formatted values
  selectedTime.value = `${formattedHours.toString().padStart(2, '0')}:${formattedMinutes.toString().padStart(2, '0')}`
}

// Function to prefill the form with test data
const prefillForm = () => {
  // Generate a random event title to avoid duplicates
  const eventTypes = ['Workshop', 'Conference', 'Meetup', 'Concert', 'Festival', 'Webinar', 'Hackathon']
  const eventAdjectives = ['Amazing', 'Incredible', 'Ultimate', 'Exclusive', 'Premier', 'Annual', 'Interactive']
  const eventSubjects = ['Tech', 'Music', 'Art', 'Food', 'Business', 'Science', 'Wellness', 'Development']

  const randomTitle = `${eventAdjectives[Math.floor(Math.random() * eventAdjectives.length)]} ${
    eventSubjects[Math.floor(Math.random() * eventSubjects.length)]
  } ${eventTypes[Math.floor(Math.random() * eventTypes.length)]}`

  // Random location
  const cities = ['New York', 'San Francisco', 'Chicago', 'Los Angeles', 'Miami', 'Seattle', 'Austin', 'Boston']
  const venues = ['Convention Center', 'Concert Hall', 'Community Space', 'Hotel Ballroom', 'Outdoor Park', 'Art Gallery']
  const randomLocation = `${venues[Math.floor(Math.random() * venues.length)]}, ${
    cities[Math.floor(Math.random() * cities.length)]
  }`

  // Select a random category
  const randomCategory = categories.value[Math.floor(Math.random() * categories.value.length)].id

  // Generate random date and time (between 1-3 months in the future)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30 + Math.floor(Math.random() * 60)) // 30-90 days in future

  const year = futureDate.getFullYear()
  const month = (futureDate.getMonth() + 1).toString().padStart(2, '0')
  const day = futureDate.getDate().toString().padStart(2, '0')
  const formattedDate = `${year}-${month}-${day}`

  // Random time (morning, afternoon, or evening)
  const hours = [9, 10, 13, 14, 18, 19]
  const randomHour = hours[Math.floor(Math.random() * hours.length)]
  const randomMinutes = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)]
  const formattedTime = `${randomHour.toString().padStart(2, '0')}:${randomMinutes}`

  // Random price (free or $10-$150)
  const randomPrice = Math.random() > 0.2 ? (Math.floor(Math.random() * 14) + 1) * 10 + 0.99 : 0

  // Random ticket count
  const randomTickets = (Math.floor(Math.random() * 10) + 1) * 50

  // Random duration
  const durations = ['2 hours', '3 hours', '4 hours', 'All day', '2 days', 'Weekend']
  const randomDuration = durations[Math.floor(Math.random() * durations.length)]

  // Fill the form with the random data
  form.title = randomTitle
  form.organizer = 'Test Organizer LLC'
  form.description = `Join us for this amazing event where you'll experience the best of ${eventSubjects[Math.floor(Math.random() * eventSubjects.length)]}.

This is a great opportunity to network with like-minded individuals and learn from industry experts. Don't miss out on this incredible experience!

• Professional speakers
• Networking opportunities
• Hands-on activities
• Refreshments provided
• Take-home materials`

  form.location = randomLocation
  form.category = randomCategory
  form.date = formattedDate
  form.time = formattedTime
  form.price = randomPrice.toString()
  form.totalTickets = randomTickets.toString()
  form.duration = randomDuration
  form.featured = Math.random() > 0.5 // 50% chance to be featured

  // Select 3-5 random event options
  form.selectedEventOptions = []
  const shuffledOptions = [...predefinedEventOptions].sort(() => 0.5 - Math.random())
  const optionsCount = Math.floor(Math.random() * 3) + 3 // 3-5 options
  form.selectedEventOptions = shuffledOptions.slice(0, optionsCount)

  // Add 1-2 custom options
  form.customEventOptions = []
  const customOptionIdeas = [
    'Free merchandise',
    'After-party included',
    'Video recording available',
    'Certificate provided',
    'Professional photos',
    'Translation services',
    'VIP meet & greet'
  ]

  if (Math.random() > 0.5) {
    const shuffledCustomOptions = [...customOptionIdeas].sort(() => 0.5 - Math.random())
    const customCount = Math.floor(Math.random() * 2) + 1 // 1-2 custom options
    form.customEventOptions = shuffledCustomOptions.slice(0, customCount)
  }

  // Add ticket types
  form.ticketTypes = [
    {
      name: 'General Admission',
      price: randomPrice,
      quantity: Math.floor(randomTickets * 0.7), // 70% of tickets
      description: 'Standard entry ticket with access to all areas.',
      salesEndDate: '',
      salesEndTime: '23:59',
      isFeatured: false
    }
  ]

  if (Math.random() > 0.3) { // 70% chance to have VIP tickets
    form.ticketTypes.push({
      name: 'VIP Experience',
      price: randomPrice * 2.5,
      quantity: Math.floor(randomTickets * 0.3), // 30% of tickets
      description: 'Premium ticket with exclusive perks and priority access.',
      salesEndDate: '',
      salesEndTime: '23:59',
      isFeatured: true
    })
  }

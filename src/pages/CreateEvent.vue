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
              <input
                id="date"
                v-model="form.date"
                type="date"
                class="form-input"
                :class="{ 'form-input--error': !validation.date.valid }"
                :min="today"
              />
              <p v-if="!validation.date.valid" class="form-error">{{ validation.date.message }}</p>
            </div>

            <div class="form-group">
              <label for="time" class="form-label">Start Time</label>
              <input
                id="time"
                v-model="form.time"
                type="time"
                class="form-input"
                :class="{ 'form-input--error': !validation.time.valid }"
              />
              <p v-if="!validation.time.valid" class="form-error">{{ validation.time.message }}</p>
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

          <div class="form-checkbox-wrapper">
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
    categories.value = eventService.getAllCategories()

    // Get sub-categories or initialize with mock data if the service doesn't provide them
    try {
      availableSubCategories.value = eventService.getAllSubCategories()
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
</script>

<style scoped>
.create-event {
  min-height: 100vh;
  background-color: #111014;
  background-image: none;
  padding: 0 0 8rem;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.create-event::before {
  display: none;
}

.create-event::after {
  display: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 3rem;
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  margin: 2.5rem 0;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  position: relative;
  padding-bottom: 2px;
}

.back-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: 0;
  left: 0;
  background-color: white;
  transition: width 0.3s ease;
}

.back-link:hover {
  color: white;
  transform: translateX(-3px);
}

.back-link:hover svg {
  transform: translateX(-3px);
}

.back-link:hover::after {
  width: 100%;
}

.back-link svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.create-event__header {
  margin-bottom: 5rem;
  text-align: center;
  position: relative;
}

.create-event__header::after {
  content: '';
  position: absolute;
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, rgba(170, 170, 170, 0.3), rgba(170, 170, 170, 0.1));
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.create-event__title {
  font-size: 32px;
  font-weight: 500;
  color: white;
  margin: 0;
  display: inline-block;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.6px;
}

.create-event__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 1rem 0 0;
  font-weight: 400;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  letter-spacing: 0.2px;
  line-height: 1.5;
}

.create-event__form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 4.5rem;
  position: relative;
  opacity: 0;
  transform: translateY(10px);
  animation: fadeIn 0.5s forwards;
  background-color: rgba(25, 24, 30, 0.2);
  border-radius: 16px;
  padding: 2.5rem;
  border: 1px solid rgba(67, 67, 70, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  width: 94%;
  margin-left: auto;
  margin-right: auto;
  backdrop-filter: blur(10px);
}

.form-section:hover {
  background-color: rgba(25, 24, 30, 0.25);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: rgba(67, 67, 70, 0.2);
  transform: translateY(-1px);
}

.form-section:nth-child(1) {
  animation-delay: 0.15s;
}
.form-section:nth-child(2) {
  animation-delay: 0.3s;
}
.form-section:nth-child(3) {
  animation-delay: 0.45s;
}
.form-section:nth-child(4) {
  animation-delay: 0.6s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-section .section-title {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.5s forwards;
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 2.25rem;
  letter-spacing: 0.3px;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  width: 30px;
  height: 1px;
  background-color: rgba(170, 170, 170, 0.5);
  bottom: -8px;
  left: 0;
  border-radius: 1px;
}

.diamond {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 12px;
  background-color: rgba(170, 170, 170, 0.7);
  transform: rotate(45deg);
  box-shadow: 0 0 8px rgba(170, 170, 170, 0.4);
}

.form-group {
  margin-bottom: 2.5rem;
  position: relative;
  transition: transform 0.2s ease;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group:focus-within {
  transform: translateX(5px);
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  transition: color 0.15s ease;
  letter-spacing: 0.3px;
}

.form-group:focus-within .form-label {
  color: #aaaaaa;
  font-weight: 600;
  transform: translateX(2px);
}

.form-input {
  width: 100%;
  height: 52px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  padding: 0 18px;
  transition: all 0.25s ease;
  font-weight: 400;
  letter-spacing: 0.2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.form-input::placeholder {
  color: rgba(111, 110, 123, 0.7);
  font-weight: 300;
}

.form-input:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-input:focus {
  outline: none;
  border-color: #aaaaaa;
  background-color: #19181e;
  box-shadow:
    0 0 0 4px rgba(170, 170, 170, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-input--error {
  border-color: #ef4444;
}

.form-input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
}

.form-select {
  width: 100%;
  height: 52px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  padding: 0 18px;
  transition: all 0.25s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236F6E7B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 14px;
  padding-right: 45px;
  font-weight: 400;
  letter-spacing: 0.2px;
}

.form-select:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-select:focus {
  outline: none;
  border-color: #aaaaaa;
  background-color: #19181e;
  box-shadow:
    0 0 0 4px rgba(170, 170, 170, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-textarea {
  width: 100%;
  min-height: 120px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  padding: 14px 18px;
  transition: all 0.25s ease;
  resize: vertical;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.2px;
}

.form-textarea::placeholder {
  color: rgba(111, 110, 123, 0.7);
  font-weight: 300;
}

.form-textarea:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-textarea:focus {
  outline: none;
  border-color: #aaaaaa;
  background-color: #19181e;
  box-shadow:
    0 0 0 4px rgba(170, 170, 170, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-row {
  display: flex;
  gap: 32px;
  margin-bottom: 2.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-helper {
  font-size: 13px;
  color: rgba(138, 137, 150, 0.7);
  margin-top: 0.75rem;
  line-height: 1.5;
  transition: opacity 0.2s ease;
}

.form-group:focus-within .form-helper {
  color: #a3a1b1;
}

.form-error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  font-weight: 400;
  animation: errorShake 0.5s forwards;
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-4px);
  }
  40%,
  80% {
    transform: translateX(4px);
  }
}

.form-error::before {
  content: '!';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #ef4444;
  border-radius: 50%;
  margin-right: 10px;
  font-size: 12px;
  font-weight: 700;
}

.form-checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background-color 0.25s ease;
  margin-left: -10px;
}

.form-checkbox-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.form-checkbox {
  appearance: none;
  width: 24px;
  height: 24px;
  background-color: #19181e;
  border: 1px solid #434346;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  flex-shrink: 0;
  margin-top: 1px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.form-checkbox:checked {
  background-color: #aaaaaa;
  border-color: #aaaaaa;
  box-shadow: 0 0 12px rgba(170, 170, 170, 0.3);
}

.form-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 4px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  animation: checkmark 0.2s ease-in-out forwards;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: rotate(45deg) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: rotate(45deg) scale(1);
  }
}

.form-checkbox:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(170, 170, 170, 0.2),
    0 2px 5px rgba(0, 0, 0, 0.1);
}

.form-checkbox:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.form-checkbox-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  user-select: none;
  cursor: pointer;
  line-height: 1.5;
  padding-top: 1px;
  font-weight: 400;
}

.location-map-placeholder {
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px dashed #434346;
  border-radius: 12px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.25rem;
  transition: all 0.25s ease;
  overflow: hidden;
  position: relative;
}

.location-map-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(25, 24, 30, 0.8), rgba(25, 24, 30, 0.5));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.location-map-placeholder:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.location-map-placeholder:hover::before {
  opacity: 1;
}

.location-map-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #8a8996;
  z-index: 1;
}

.location-map-content svg {
  margin-bottom: 1rem;
  opacity: 0.7;
  transition: all 0.25s ease;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2));
}

.location-map-placeholder:hover .location-map-content svg {
  opacity: 1;
  transform: scale(1.2);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 4rem;
}

.btn-primary {
  height: 50px;
  padding: 0 32px;
  background-color: rgba(170, 170, 170, 0.9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  letter-spacing: 0.4px;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #cccccc, #999999);
  transition: opacity 0.3s ease;
  opacity: 0;
  z-index: -1;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(170, 170, 170, 0.3);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(170, 170, 170, 0.25);
}

.btn-secondary {
  height: 50px;
  padding: 0 32px;
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  letter-spacing: 0.3px;
  backdrop-filter: blur(4px);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-secondary:active {
  background-color: rgba(255, 255, 255, 0.08);
  transform: translateY(0);
}

.create-event__alert {
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 2.5rem;
  font-size: 16px;
  display: flex;
  align-items: center;
  background-color: #19181e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid #434346;
  animation: alertSlideIn 0.5s forwards;
  opacity: 0;
  transform: translateY(-20px);
}

@keyframes alertSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.create-event__alert::before {
  content: '';
  width: 24px;
  height: 24px;
  margin-right: 16px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  flex-shrink: 0;
}

.create-event__alert--error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.create-event__alert--error::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='8' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='16' x2='12.01' y2='16'%3E%3C/line%3E%3C/svg%3E");
}

.create-event__alert--success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.create-event__alert--success::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 11.08V12a10 10 0 1 1-5.93-9.14'%3E%3C/path%3E%3Cpolyline points='22 4 12 14.01 9 11.01'%3E%3C/polyline%3E%3C/svg%3E");
}

.spinner {
  animation: rotate 1.2s linear infinite;
  margin-right: 12px;
  width: 20px;
  height: 20px;
}

.spinner circle {
  stroke: currentColor;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.5rem;
  }

  .form-section {
    padding: 2rem 1.5rem;
    width: 100%;
  }

  .form-row {
    flex-direction: column;
    gap: 1.75rem;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 16px;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .create-event__title {
    font-size: 32px;
  }
}

@media (max-width: 480px) {
  .create-event__title {
    font-size: 28px;
  }

  .create-event__subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 20px;
  }

  .form-label {
    font-size: 15px;
  }
}

.sub-categories-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 0.5rem;
}

.sub-category-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: rgba(25, 24, 30, 0.5);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(67, 67, 70, 0.2);
  transition: all 0.25s ease;
  position: relative;
  animation: slideIn 0.3s forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sub-category-item:hover {
  background-color: rgba(25, 24, 30, 0.7);
  border-color: rgba(67, 67, 70, 0.3);
  transform: translateX(3px);
}

.sub-category-select {
  flex: 1;
}

.sub-category-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.sub-category-remove:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.sub-category-remove:active {
  transform: scale(0.95);
}

.add-sub-category-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background-color: rgba(170, 170, 170, 0.1);
  border: 1px solid rgba(170, 170, 170, 0.2);
  border-radius: 10px;
  color: #cccccc;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 12px;
  width: fit-content;
  position: relative;
  overflow: hidden;
}

.add-sub-category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(170, 170, 170, 0.15), rgba(170, 170, 170, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.add-sub-category-btn:hover {
  background-color: rgba(170, 170, 170, 0.15);
  border-color: rgba(170, 170, 170, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(170, 170, 170, 0.1);
}

.add-sub-category-btn:active {
  transform: translateY(0);
}

.add-sub-category-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-sub-category-btn svg {
  transition: transform 0.3s ease;
}

.add-sub-category-btn:hover svg {
  transform: rotate(90deg);
}

.create-event__note {
  margin-top: 4rem;
  padding: 20px;
  background-color: rgba(25, 24, 30, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(67, 67, 70, 0.2);
  backdrop-filter: blur(10px);
  width: 90%;
  margin-left: auto;
  margin-right: auto;
}

.create-event__note p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.create-event__note strong {
  color: rgba(255, 255, 255, 0.9);
}

.ticket-types-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ticket-type-card {
  background-color: rgba(25, 24, 30, 0.4);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(67, 67, 70, 0.3);
  transition: all 0.25s ease;
  position: relative;
  animation: fadeIn 0.4s ease-out;
}

.ticket-type-card:hover {
  background-color: rgba(25, 24, 30, 0.5);
  border-color: rgba(67, 67, 70, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.ticket-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ticket-type-title {
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
}

.ticket-type-actions {
  display: flex;
  gap: 8px;
}

.ticket-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(67, 67, 70, 0.3);
  background-color: rgba(25, 24, 30, 0.7);
  color: #cccccc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ticket-action-duplicate:hover {
  background-color: rgba(170, 170, 170, 0.15);
  border-color: rgba(170, 170, 170, 0.3);
  color: #ffffff;
  transform: scale(1.05);
}

.ticket-action-remove:hover {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: scale(1.05);
}

.ticket-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.ticket-name-input-wrapper {
  display: flex;
  gap: 10px;
}

.ticket-template-dropdown {
  position: relative;
}

.ticket-template-btn {
  height: 58px;
  padding: 0 16px;
  background-color: rgba(25, 24, 30, 0.7);
  border: 1px solid rgba(67, 67, 70, 0.3);
  border-radius: 12px;
  color: #cccccc;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.ticket-template-btn:hover {
  background-color: rgba(25, 24, 30, 0.9);
  border-color: rgba(67, 67, 70, 0.5);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ticket-template-options {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background-color: #19181e;
  border: 1px solid rgba(67, 67, 70, 0.3);
  border-radius: 10px;
  padding: 8px;
  z-index: 10;
  width: 180px;
  display: none;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Remove this hover effect that shows dropdown */
.ticket-template-dropdown:hover .ticket-template-options {
  display: none; /* Changed from flex to none to prevent display on hover */
}

.ticket-template-option {
  padding: 10px 14px;
  border-radius: 6px;
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.ticket-template-option:hover {
  background-color: rgba(170, 170, 170, 0.1);
}

.ticket-description {
  min-height: 80px;
}

.ticket-sales-period {
  margin-top: 10px;
  margin-bottom: 20px;
}

.ticket-section-subtitle {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 4px 0;
}

.ticket-section-helper {
  font-size: 13px;
  color: rgba(138, 137, 150, 0.7);
  margin: 0 0 14px 0;
  line-height: 1.5;
}

.add-ticket-type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background-color: rgba(25, 24, 30, 0.4);
  border: 1px dashed rgba(67, 67, 70, 0.4);
  border-radius: 12px;
  color: #cccccc;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  width: 100%;
  margin-top: 12px;
}

.add-ticket-type-btn:hover {
  background-color: rgba(25, 24, 30, 0.6);
  border-color: rgba(170, 170, 170, 0.4);
  color: #ffffff;
  transform: translateY(-2px);
}

.add-ticket-type-btn svg {
  transition: transform 0.3s ease;
}

.add-ticket-type-btn:hover svg {
  transform: rotate(90deg);
}

.ticket-types-error {
  margin-bottom: 20px;
}

/* Modal styles */
.ticket-template-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out forwards;
}

.ticket-template-modal {
  width: 90%;
  max-width: 600px;
  background-color: #19181e;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;
  transform: translateY(20px);
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.ticket-template-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ticket-template-modal-header h3 {
  font-size: 18px;
  font-weight: 400;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.3px;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.ticket-template-modal-body {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.template-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(170, 170, 170, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.template-card:hover::before {
  opacity: 1;
}

.template-card-content {
  flex: 1;
}

.template-name {
  font-size: 16px;
  font-weight: 400;
  color: #ffffff;
  margin: 0 0 6px 0;
}

.template-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.4;
}

.template-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #aaaaaa;
  color: #19181e;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
}

.template-card:hover .template-card-icon {
  opacity: 1;
  transform: scale(1);
}

/* Update existing template dropdown */
.ticket-template-options {
  display: none; /* Hide dropdown since we're using modal now */
}

@media (max-width: 768px) {
  .ticket-template-modal {
    width: 95%;
    max-height: 80vh;
  }

  .ticket-template-modal-body {
    grid-template-columns: 1fr;
  }
}

/* Subcategory modal styles */
.subcategory-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out forwards;
}

.subcategory-modal {
  width: 90%;
  max-width: 600px;
  background-color: #19181e;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;
  transform: translateY(20px);
  opacity: 0;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.subcategory-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.subcategory-modal-header h3 {
  font-size: 18px;
  font-weight: 400;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.3px;
}

.subcategory-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.subcategory-modal-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.subcategory-search {
  margin-bottom: 16px;
}

.subcategory-search-input {
  width: 100%;
  height: 46px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  padding: 0 18px;
  transition: all 0.25s ease;
}

.subcategory-search-input:focus {
  outline: none;
  border-color: rgba(170, 170, 170, 0.5);
  box-shadow: 0 0 0 3px rgba(170, 170, 170, 0.15);
}

.subcategory-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.subcategory-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subcategory-section-title {
  font-size: 15px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 0.2px;
}

.subcategory-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.subcategory-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  border: 1px solid transparent;
}

/* Modified hover style to use the pink color */
.subcategory-chip:hover {
  background-color: rgba(233, 75, 159, 0.05);
  transform: translateY(-1px);
}

.subcategory-chip--selected {
  background-color: rgba(233, 75, 159, 0.08);
  border-color: rgba(233, 75, 159, 0.2);
  color: white;
}

.subcategory-chip--custom {
  background-color: rgba(119, 81, 200, 0.15);
  border-color: rgba(119, 81, 200, 0.3);
}

.custom-subcategory-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.custom-input {
  height: 46px;
}

.add-custom-btn {
  padding: 0 16px;
  background-color: rgba(170, 170, 170, 0.2);
  border: 1px solid rgba(170, 170, 170, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-custom-btn:hover:not(:disabled) {
  background-color: rgba(233, 75, 159, 0.15);
  transform: translateY(-1px);
}

.add-custom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-custom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  padding: 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-custom-btn:hover {
  color: white;
  transform: scale(1.1);
}

.subcategory-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 10px;
}

.subcategory-count {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.subcategory-actions {
  display: flex;
  gap: 12px;
}

.subcategory-actions .btn-primary,
.subcategory-actions .btn-secondary {
  height: 42px;
  min-width: auto;
  padding: 0 20px;
  font-size: 14px;
}

/* Selected subcategories display in the form */
.subcategories-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-subcategories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 46px;
  padding: 5px;
  background-color: rgba(25, 24, 30, 0.3);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 10px;
}

.no-subcategories {
  color: rgba(111, 110, 123, 0.7);
  font-size: 14px;
  padding: 8px 12px;
  font-style: italic;
}

.selected-subcategory {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  background-color: rgba(233, 75, 159, 0.07);
  border: 1px solid rgba(233, 75, 159, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.remove-subcategory-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  padding: 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-subcategory-btn:hover {
  color: white;
  transform: scale(1.1);
}

.manage-subcategories-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.manage-subcategories-btn:hover:not(:disabled) {
  background-color: rgba(25, 24, 30, 0.7);
  border-color: rgba(170, 170, 170, 0.3);
  transform: translateY(-1px);
}

.manage-subcategories-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.manage-subcategories-btn svg {
  transition: transform 0.2s ease;
}

.manage-subcategories-btn:hover:not(:disabled) svg {
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .subcategory-modal {
    width: 95%;
    max-height: 80vh;
  }

  .subcategory-modal-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .subcategory-actions {
    flex-direction: column;
  }
}

/* Add focus styling for inputs */
.form-input:focus,
.form-select:focus,
.form-textarea:focus,
.subcategory-search-input:focus {
  outline: none;
  border-color: rgba(233, 75, 159, 0.3);
  box-shadow: 0 0 0 1px rgba(233, 75, 159, 0.15);
  background-color: rgba(25, 24, 30, 0.5);
}

/* Update form group focus style */
.form-group:focus-within .form-label {
  color: rgba(233, 75, 159, 0.7);
  font-weight: 400;
  transform: translateX(1px);
}

/* FAQ section styles */
.section-optional {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 300;
  margin-left: 8px;
}

.section-intro {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.faq-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.faq-item {
  background-color: rgba(25, 24, 30, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(67, 67, 70, 0.2);
  overflow: hidden;
  transition: all 0.25s ease;
}

.faq-item:hover {
  background-color: rgba(25, 24, 30, 0.4);
  border-color: rgba(67, 67, 70, 0.3);
  transform: translateY(-1px);
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(67, 67, 70, 0.15);
}

.faq-number {
  font-size: 14px;
  font-weight: 400;
  color: rgba(233, 75, 159, 0.7);
  margin: 0;
  letter-spacing: 0.5px;
}

.faq-actions {
  display: flex;
  gap: 8px;
}

.faq-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: rgba(25, 24, 30, 0.5);
  border: 1px solid rgba(67, 67, 70, 0.25);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.faq-action-remove:hover {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: scale(1.05);
}

.faq-content {
  padding: 16px;
}

.faq-answer {
  min-height: 80px;
}

.add-faq-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background-color: rgba(25, 24, 30, 0.4);
  border: 1px dashed rgba(67, 67, 70, 0.4);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.25s ease;
}

.add-faq-btn:hover {
  background-color: rgba(25, 24, 30, 0.6);
  border-color: rgba(233, 75, 159, 0.25);
  color: white;
  transform: translateY(-2px);
}

.add-faq-btn svg {
  transition: transform 0.3s ease;
}

.add-faq-btn:hover svg {
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .faq-content {
    padding: 12px;
  }
}

.image-upload-container {
  width: 100%;
  margin-bottom: 10px;
}

.image-upload-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

.image-upload-dropzone {
  position: relative;
  flex: 1;
  background-color: rgba(25, 24, 30, 0.4);
  border: 2px dashed rgba(67, 67, 70, 0.4);
  border-radius: 10px;
  height: 160px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.25s ease;
}

.image-upload-dropzone:hover {
  background-color: rgba(25, 24, 30, 0.6);
  border-color: rgba(170, 170, 170, 0.5);
  transform: translateY(-2px);
}

.banner-dropzone {
  flex: 2;
}

.has-image {
  border-style: solid;
  border-color: rgba(170, 170, 170, 0.3);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  padding: 15px;
}

.upload-icon {
  color: rgba(170, 170, 170, 0.6);
  transition: all 0.25s ease;
}

.image-upload-dropzone:hover .upload-icon {
  color: rgba(170, 170, 170, 0.9);
  transform: scale(1.1);
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.primary-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 3px;
}

.secondary-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.image-inputs {
  display: none;
}

.image-input {
  display: none;
}

.banner-preview {
  width: 200px;
  height: 100px;
  border-radius: 10px;
  background-color: #333;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.image-upload-dropzone:hover .image-overlay {
  opacity: 1;
}

.remove-image-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(239, 68, 68, 0.2);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background-color: rgba(239, 68, 68, 0.4);
  transform: scale(1.05);
}

.remove-image-btn svg {
  width: 16px;
  height: 16px;
}
</style>

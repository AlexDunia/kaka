<script setup>
import { ref } from 'vue'

const formData = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const loading = ref(false)
const error = ref(null)
const success = ref(false)

const submitForm = async () => {
  // Validate form
  if (!formData.value.name || !formData.value.email || !formData.value.message) {
    error.value = 'Please fill in all required fields'
    return
  }

  // Reset status
  error.value = null
  loading.value = true

  try {
    // In a real app, this would be an API call
    // Simulate API call with timeout
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Show success message
    success.value = true

    // Reset form
    formData.value = {
      name: '',
      email: '',
      subject: '',
      message: '',
    }
  } catch (_) {
    error.value = 'Failed to send your message. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contact-page">
    <div class="container">
      <div class="contact-page__header">
        <h1 class="contact-page__title">Contact Us</h1>
        <p class="contact-page__subtitle">
          Have a question or need assistance? We're here to help!
        </p>
      </div>

      <div class="contact-page__content">
        <div class="contact-page__info">
          <div class="contact-info-card">
            <div class="contact-info-card__icon">
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
                <path
                  d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                ></path>
              </svg>
            </div>
            <h3 class="contact-info-card__title">Phone</h3>
            <p class="contact-info-card__detail">+1 (555) 123-4567</p>
            <p class="contact-info-card__hours">Mon-Fri: 9am - 6pm</p>
          </div>

          <div class="contact-info-card">
            <div class="contact-info-card__icon">
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
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                ></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3 class="contact-info-card__title">Email</h3>
            <p class="contact-info-card__detail">support@tixdemand.com</p>
            <p class="contact-info-card__hours">We respond within 24 hours</p>
          </div>

          <div class="contact-info-card">
            <div class="contact-info-card__icon">
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
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 class="contact-info-card__title">Office</h3>
            <p class="contact-info-card__detail">123 Event Street, Suite 500</p>
            <p class="contact-info-card__hours">New York, NY 10001</p>
          </div>
        </div>

        <div class="contact-page__form-container">
          <div v-if="success" class="contact-form-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>Message Sent!</h3>
            <p>Thank you for contacting us. We'll get back to you as soon as possible.</p>
            <button class="btn" @click="success = false">Send Another Message</button>
          </div>

          <form v-else class="contact-form" @submit.prevent="submitForm">
            <h2 class="contact-form__title">Send Us a Message</h2>

            <div v-if="error" class="contact-form__error">
              {{ error }}
            </div>

            <div class="contact-form__field">
              <label for="name" class="contact-form__label">Name*</label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                class="contact-form__input"
                placeholder="Your name"
                required
              />
            </div>

            <div class="contact-form__field">
              <label for="email" class="contact-form__label">Email*</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="contact-form__input"
                placeholder="Your email address"
                required
              />
            </div>

            <div class="contact-form__field">
              <label for="subject" class="contact-form__label">Subject</label>
              <input
                id="subject"
                v-model="formData.subject"
                type="text"
                class="contact-form__input"
                placeholder="What is this about?"
              />
            </div>

            <div class="contact-form__field">
              <label for="message" class="contact-form__label">Message*</label>
              <textarea
                id="message"
                v-model="formData.message"
                class="contact-form__textarea"
                placeholder="Your message"
                rows="5"
                required
              ></textarea>
            </div>

            <button type="submit" class="contact-form__submit" :disabled="loading">
              <span v-if="loading">Sending...</span>
              <span v-else>Send Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  padding: 3rem 0;
}

.contact-page__header {
  text-align: center;
  margin-bottom: 3rem;
}

.contact-page__title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.contact-page__subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  margin: 0 auto;
}

.contact-page__content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.contact-page__info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-info-card {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.contact-info-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: rgba(232, 67, 147, 0.1);
  border-radius: 50%;
  margin-bottom: 1rem;
}

.contact-info-card__icon svg {
  color: var(--primary);
}

.contact-info-card__title {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.contact-info-card__detail {
  color: var(--primary);
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.contact-info-card__hours {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.contact-page__form-container {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.contact-form-success {
  text-align: center;
  padding: 2rem 0;
}

.contact-form-success svg {
  color: var(--success);
  margin-bottom: 1rem;
}

.contact-form-success h3 {
  color: var(--success);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.contact-form-success p {
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.8);
}

.contact-form__title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.contact-form__error {
  background-color: rgba(255, 77, 77, 0.2);
  color: var(--error);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.contact-form__field {
  margin-bottom: 1.25rem;
}

.contact-form__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.contact-form__input,
.contact-form__textarea {
  transition: border-color 0.3s ease;
}

.contact-form__input:focus,
.contact-form__textarea:focus {
  border-color: var(--primary);
}

.contact-form__textarea {
  resize: vertical;
  min-height: 120px;
}

.contact-form__submit {
  width: 100%;
  padding: 0.75rem;
  font-weight: bold;
}

.contact-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 992px) {
  .contact-page__content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .contact-page__info {
    flex-direction: row;
  }

  .contact-info-card {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .contact-page__title {
    font-size: 2rem;
  }

  .contact-page__info {
    flex-direction: column;
  }

  .contact-page__form-container {
    padding: 1.5rem;
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import emailjs from '@emailjs/browser'

// Initialize EmailJS
onMounted(() => {
  emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)
})

const formData = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const loading = ref(false)
const error = ref('')
const success = ref(false)
const isSubmitting = ref(false)

const handleSubmit = async () => {
  isSubmitting.value = true
  success.value = false
  error.value = ''

  try {
    const emailParams = {
      from_name: formData.value.name,
      from_email: formData.value.email,
      message: formData.value.message,
      subject: formData.value.subject,
    }

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      emailParams,
    )

    success.value = true
    formData.value = { name: '', email: '', subject: '', message: '' }
  } catch (_) {
    error.value = 'Failed to send message. Please try again later.'
  } finally {
    isSubmitting.value = false
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
            <p class="contact-info-card__detail">+2348108725914</p>
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
            <p class="contact-info-card__detail">kakaworldevent@gmail.com</p>
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
            <h3 class="contact-info-card__title">Location</h3>
            <p class="contact-info-card__detail">Lagos, Nigeria</p>
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

          <form v-else class="contact-form" @submit.prevent="handleSubmit">
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
  padding: 4rem 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
  min-height: calc(100vh - 60px);
}

.contact-page__header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeIn 0.8s ease-out;
}

.contact-page__title {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, #ff79c6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.contact-page__subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.contact-page__content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.contact-page__info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.contact-info-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  transform: translateY(0);
}

.contact-info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.contact-info-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(232, 67, 147, 0.2) 0%, rgba(232, 67, 147, 0.1) 100%);
  border-radius: 16px;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.contact-info-card:hover .contact-info-card__icon {
  transform: scale(1.1);
  background: linear-gradient(135deg, rgba(232, 67, 147, 0.3) 0%, rgba(232, 67, 147, 0.2) 100%);
}

.contact-info-card__icon svg {
  color: var(--primary);
  transition: all 0.3s ease;
  width: 28px;
  height: 28px;
}

.contact-info-card:hover .contact-info-card__icon svg {
  transform: scale(1.1);
}

.contact-info-card__title {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.contact-info-card__detail {
  color: var(--primary);
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.contact-info-card:hover .contact-info-card__detail {
  color: #ff79c6;
}

.contact-info-card__hours {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}

.contact-page__form-container {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: slideUp 0.8s ease-out;
}

.contact-form-success {
  text-align: center;
  padding: 3rem 0;
}

.contact-form-success svg {
  color: #50fa7b;
  margin-bottom: 1.5rem;
  width: 60px;
  height: 60px;
  animation: successPop 0.5s ease-out;
}

.contact-form-success h3 {
  color: #50fa7b;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.contact-form-success p {
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
}

.contact-form__title {
  margin-bottom: 2rem;
  font-size: 1.8rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}

.contact-form__error {
  background: rgba(255, 77, 77, 0.1);
  border-left: 4px solid #ff5555;
  color: #ff5555;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  animation: shake 0.5s ease-out;
}

.contact-form__field {
  margin-bottom: 1.5rem;
}

.contact-form__label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.contact-form__input,
.contact-form__textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.contact-form__input:hover,
.contact-form__textarea:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.contact-form__input:focus,
.contact-form__textarea:focus {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(232, 67, 147, 0.1);
}

.contact-form__textarea {
  resize: vertical;
  min-height: 140px;
}

.contact-form__submit {
  width: 100%;
  padding: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  background: linear-gradient(135deg, var(--primary) 0%, #ff79c6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateY(0);
}

.contact-form__submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(232, 67, 147, 0.2);
}

.contact-form__submit:active:not(:disabled) {
  transform: translateY(0);
}

.contact-form__submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #666 0%, #888 100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes successPop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

@media (max-width: 1200px) {
  .contact-page__content {
    max-width: 1000px;
  }
}

@media (max-width: 992px) {
  .contact-page__content {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 0 1.5rem;
  }

  .contact-page__info {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .contact-info-card {
    flex: 1;
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .contact-page {
    padding: 3rem 0;
  }

  .contact-page__title {
    font-size: 2.5rem;
  }

  .contact-page__info {
    flex-direction: column;
  }

  .contact-page__form-container {
    padding: 2rem;
  }

  .contact-info-card {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .contact-page__title {
    font-size: 2rem;
  }

  .contact-page__content {
    padding: 0 1rem;
  }

  .contact-page__form-container {
    padding: 1.5rem;
  }
}
</style>

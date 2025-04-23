<template>
  <div class="event-detail">
    <h1 class="event-title">International Film Festival</h1>

    <div class="category-pill">
      <span>movies</span>
    </div>

    <div class="info-cards">
      <div class="info-card">
        <div class="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="content">
          <h3>DATE & TIME</h3>
          <p>Saturday, August 10, 2024 at 08:30 PM</p>
        </div>
      </div>

      <div class="info-card">
        <div class="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
        </div>
        <div class="content">
          <h3>LOCATION</h3>
          <p>Cinema Plaza, Los Angeles</p>
        </div>
      </div>

      <div class="info-card">
        <div class="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="content">
          <h3>DURATION</h3>
          <p>3 hours</p>
        </div>
      </div>
    </div>

    <div class="about-section">
      <h2>About This Event</h2>
      <p>Showcasing award-winning films from independent filmmakers.</p>

      <div class="features">
        <div class="feature">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
          <span>Live performance</span>
        </div>

        <div class="feature">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
          <span>Food & drinks available</span>
        </div>

        <div class="feature">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Indoor event</span>
        </div>
      </div>
    </div>

    <div class="tickets-section">
      <h2>Ticket Availability</h2>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress"></div>
        </div>

        <div class="stats">
          <div class="left">
            <span class="number">650</span>
            <span class="label">tickets left</span>
          </div>

          <div class="sold">
            <span class="number">35%</span>
            <span class="label">sold</span>
          </div>
        </div>
      </div>

      <button class="favorite-btn">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          ></path>
        </svg>
        <span>ADD TO FAVORITES</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.event-detail {
  color: white;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  animation: fadeIn 0.6s ease forwards;
}

/* Enhanced title with subtle gradient */
.event-title {
  font-size: 2.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition:
    transform 0.3s ease,
    text-shadow 0.3s ease;
}

.event-title:hover {
  transform: translateY(-2px);
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Category badge with hover effect */
.category-pill {
  margin-bottom: 2rem;
}

.category-pill span {
  background: rgba(30, 30, 40, 0.6);
  backdrop-filter: blur(8px);
  padding: 0.5rem 1.2rem;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.category-pill span:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(35, 35, 45, 0.7);
}

/* Info cards with animations */
.info-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2.5rem;
  animation: slideUp 0.7s ease forwards;
  animation-delay: 0.1s;
  opacity: 0;
  transform: translateY(20px);
}

.info-card {
  background: rgba(30, 30, 40, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 1.2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(35, 35, 45, 0.7);
}

.icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 42px;
  background: rgba(232, 67, 147, 0.15);
  border-radius: 10px;
  color: #e84393;
  transition: all 0.3s ease;
}

.info-card:hover .icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(232, 67, 147, 0.25);
  box-shadow: 0 0 15px rgba(232, 67, 147, 0.2);
}

.content h3 {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.3rem;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.info-card:hover .content h3 {
  color: rgba(255, 255, 255, 0.9);
}

.content p {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  transition: color 0.3s ease;
}

/* About section */
.about-section {
  margin-bottom: 2.5rem;
  animation: fadeIn 0.8s ease forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.about-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  transition: transform 0.3s ease;
}

.about-section h2::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #e84393, transparent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.about-section h2:hover {
  transform: translateY(-2px);
}

.about-section h2:hover::after {
  width: 100%;
}

.about-section p {
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

/* Features */
.features {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem 1.2rem;
  background: rgba(25, 25, 35, 0.6);
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.feature::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, #e84393, #f368e0);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
}

.feature:hover::before {
  opacity: 0.05;
}

.feature svg {
  color: #e84393;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.feature:hover svg {
  transform: scale(1.2);
  filter: drop-shadow(0 0 5px rgba(232, 67, 147, 0.5));
}

.feature span {
  position: relative;
  z-index: 1;
}

/* Tickets section with animated progress bar */
.tickets-section {
  animation: fadeIn 0.8s ease forwards;
  animation-delay: 0.3s;
  opacity: 0;
}

.tickets-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.tickets-section h2::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #e84393, transparent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.tickets-section h2:hover::after {
  width: 100%;
}

.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 35%;
  background: linear-gradient(90deg, #e84393, #f368e0);
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(232, 67, 147, 0.3);
  animation: progressGrow 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.number {
  font-weight: 700;
  font-size: 1.2rem;
  transition:
    transform 0.3s ease,
    text-shadow 0.3s ease;
}

.left:hover .number,
.sold:hover .number {
  transform: translateY(-2px);
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.sold .number {
  color: #e84393;
  text-shadow: 0 0 10px rgba(232, 67, 147, 0.3);
}

.label {
  color: rgba(255, 255, 255, 0.5);
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

/* Favorite button */
.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  max-width: 300px;
  background: rgba(30, 30, 40, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 0.8rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.favorite-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, #e84393, #f368e0);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.favorite-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: rgba(232, 67, 147, 0.3);
}

.favorite-btn:hover::before {
  opacity: 0.1;
}

.favorite-btn:active {
  transform: translateY(-2px);
}

.favorite-btn svg {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.favorite-btn:hover svg {
  transform: scale(1.15);
  filter: drop-shadow(0 0 5px rgba(232, 67, 147, 0.5));
}

.favorite-btn span {
  position: relative;
  z-index: 1;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressGrow {
  from {
    width: 0%;
  }
  to {
    width: 35%;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-cards {
    grid-template-columns: 1fr;
  }
}
</style>

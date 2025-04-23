<template>
 <div class="feature-badge">
    <div class="feature-icon">
      <slot name="icon"></slot>
    </div>
    <span><slot>Feature</slot></span>
  </div>
</template>

<style scoped>
.feature-badge {
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

.feature-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #e84393, #f368e0);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.feature-badge:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
}

.feature-badge:hover::before {
  opacity: 0.05;
}

.feature-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #e84393;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.feature-badge:hover .feature-icon {
  transform: scale(1.2);
  filter: drop-shadow(0 0 5px rgba(232, 67, 147, 0.5));
}

.feature-badge span {
  position: relative;

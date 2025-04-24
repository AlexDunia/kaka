<template>
  <div class="datetime-picker-example">
    <h1>Date Time Picker Example</h1>

    <div class="example-container">
      <div class="form-group">
        <h2>Basic Usage</h2>
        <DateTimePickerInput
          v-model="basicDate"
          label="Event Date and Time"
          placeholder="Select event date and time"
        />
        <p class="selected-value">
          Selected value: <span>{{ basicDate ? basicDate.toString() : 'No date selected' }}</span>
        </p>
      </div>

      <div class="form-group">
        <h2>With Min/Max Date Restrictions</h2>
        <DateTimePickerInput
          v-model="restrictedDate"
          label="Appointment Date and Time"
          placeholder="Select an appointment time"
          :min-date="minDate"
          :max-date="maxDate"
          modal-title="Select Appointment Time"
        />
        <p class="selected-value">
          Selected value:
          <span>{{ restrictedDate ? restrictedDate.toString() : 'No date selected' }}</span>
        </p>
        <p class="note">
          Note: Dates are restricted between {{ minDate.toLocaleDateString() }} and
          {{ maxDate.toLocaleDateString() }}
        </p>
      </div>

      <div class="form-group">
        <h2>With Custom Format</h2>
        <DateTimePickerInput
          v-model="formattedDate"
          label="Custom Format"
          placeholder="Select date and time"
          date-format="DD/MM/YYYY"
          time-format="HH:mm"
          :use12-hour-format="false"
        />
        <p class="selected-value">
          Selected value:
          <span>{{ formattedDate ? formattedDate.toString() : 'No date selected' }}</span>
        </p>
      </div>

      <div class="form-group">
        <h2>With Error State</h2>
        <DateTimePickerInput
          v-model="errorDate"
          label="Required Field"
          placeholder="This field is required"
          :error="errorMessage"
        />
        <button @click="validateDate" class="validate-btn">Validate</button>
      </div>
    </div>

    <div class="code-example">
      <h2>Implementation Example</h2>
      <pre>
&lt;template&gt;
  &lt;DateTimePickerInput
    v-model="date"
    label="Event Date and Time"
    placeholder="Select event date and time"
    :min-date="minDate"
    :max-date="maxDate"
    :error="errorMessage"
  /&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import DateTimePickerInput from '@/components/DateTimePickerInput.vue';

const date = ref(new Date());
const minDate = ref(new Date()); // Today
const maxDate = ref(new Date()); // A month from now
maxDate.value.setMonth(maxDate.value.getMonth() + 1);
const errorMessage = ref('');

// Validate if needed
function validateForm() {
  if (!date.value) {
    errorMessage.value = 'Please select a date and time';
    return false;
  }
  errorMessage.value = '';
  return true;
}
&lt;/script&gt;
      </pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DateTimePickerInput from '../components/DateTimePickerInput.vue'

// Basic example
const basicDate = ref(new Date())

// Min/Max Date example
const minDate = ref(new Date())
const maxDate = ref(new Date())
maxDate.value.setMonth(maxDate.value.getMonth() + 1) // One month from now
const restrictedDate = ref(new Date())

// Custom format example
const formattedDate = ref(new Date())

// Error state example
const errorDate = ref(null)
const errorMessage = ref('')

function validateDate() {
  if (!errorDate.value) {
    errorMessage.value = 'This field is required. Please select a date and time.'
  } else {
    errorMessage.value = ''
    alert('Validation passed! Selected date: ' + errorDate.value.toString())
  }
}
</script>

<style scoped>
.datetime-picker-example {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
  text-align: center;
}

h2 {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #444;
}

.example-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.form-group {
  background-color: #fff;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.selected-value {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.selected-value span {
  font-weight: 500;
  color: #333;
}

.note {
  margin-top: 10px;
  font-size: 13px;
  color: #888;
  font-style: italic;
}

.validate-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.validate-btn:hover {
  background-color: #3755d8;
}

.code-example {
  background-color: #f8f9fc;
  padding: 25px;
  border-radius: 10px;
  margin-top: 40px;
}

.code-example h2 {
  margin-top: 0;
}

pre {
  padding: 20px;
  background-color: #282c34;
  color: #abb2bf;
  border-radius: 6px;
  overflow-x: auto;
  font-family: 'Fira Code', Consolas, Monaco, 'Andale Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>

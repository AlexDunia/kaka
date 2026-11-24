const id = 'paystack-inline-v2'
const url = 'https://js.paystack.co/v2/inline.js'
let promise = null
export const loadPaystack = () => {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let timer
    const fail = () => {
      clearTimeout(timer)
      script.remove()
      promise = null
      reject(new Error('Payment could not be opened. Check your connection and try again.'))
    }
    script.id = id
    script.src = url
    script.async = true
    script.onload = () => {
      clearTimeout(timer)
      if (window.PaystackPop) resolve(window.PaystackPop)
      else fail()
    }
    script.onerror = fail
    timer = setTimeout(fail, 15000)
    document.head.appendChild(script)
  })
  return promise
}

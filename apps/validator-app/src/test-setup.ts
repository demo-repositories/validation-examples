// jsdom's idle callback does not run during tests, and @sanity/validation captures it on import.
if (typeof window !== 'undefined') {
  window.requestIdleCallback = (callback) => {
    const timeout = setTimeout(() => callback({didTimeout: false, timeRemaining: () => 50} as IdleDeadline))
    return timeout as unknown as number
  }
  window.cancelIdleCallback = (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
}

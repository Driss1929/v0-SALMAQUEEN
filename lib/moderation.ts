// Content moderation utilities
const PROFANITY_WORDS = [
  "damn",
  "hell",
  "crap",
  "stupid",
  "idiot",
  "moron",
  "dumb",
  "hate",
  // Add more words as needed - this is a basic list
]

const SPAM_PATTERNS = [
  /(.)\1{4,}/g, // Repeated characters (aaaaa)
  /^[A-Z\s!]{10,}$/g, // All caps with exclamation
  /(https?:\/\/[^\s]+){3,}/g, // Multiple URLs
]

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase()
  return PROFANITY_WORDS.some((word) => lowerText.includes(word))
}

export function filterProfanity(text: string): string {
  let filteredText = text
  PROFANITY_WORDS.forEach((word) => {
    const regex = new RegExp(word, "gi")
    filteredText = filteredText.replace(regex, "*".repeat(word.length))
  })
  return filteredText
}

export function detectSpam(text: string): boolean {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text))
}

export function getRateLimitKey(userId: string, action: string): string {
  return `rate_limit:${userId}:${action}`
}

export function calculateCooldown(lastActionTime: Date): number {
  const now = new Date()
  const timeDiff = now.getTime() - lastActionTime.getTime()
  const cooldownPeriod = 30 * 1000 // 30 seconds
  return Math.max(0, cooldownPeriod - timeDiff)
}

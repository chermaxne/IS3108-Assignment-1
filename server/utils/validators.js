/**
 * Input Validation Utilities
 * Provides consistent validation across the application
 */

// Email validation - RFC 5322 simplified
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: "Email is required" }
  }

  const trimmed = email.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Email cannot be empty" }
  }

  if (trimmed.length > 255) {
    return { isValid: false, error: "Email is too long (max 255 characters)" }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Email format is invalid" }
  }

  return { isValid: true }
}

/**
 * Validate customer name
 * @param {string} name - Name to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateCustomerName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: "Customer name is required" }
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Customer name cannot be empty" }
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Customer name must be at least 2 characters" }
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: "Customer name is too long (max 100 characters)" }
  }

  // Allow letters, spaces, hyphens, and apostrophes only
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { isValid: false, error: "Customer name contains invalid characters" }
  }

  return { isValid: true }
}

/**
 * Validate seat label format (e.g., "A1", "H5")
 * @param {string} seatLabel - Seat to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateSeatLabel = (seatLabel) => {
  if (!seatLabel || typeof seatLabel !== 'string') {
    return { isValid: false, error: "Seat label is required" }
  }

  const trimmed = seatLabel.trim().toUpperCase()
  
  // Format: letter(s) followed by number(s), e.g., A1, AA12
  if (!/^[A-Z]+\d+$/.test(trimmed)) {
    return { isValid: false, error: "Invalid seat format" }
  }

  return { isValid: true }
}

/**
 * Validate username (staff login)
 * @param {string} username - Username to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: "Username is required" }
  }

  const trimmed = username.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Username cannot be empty" }
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" }
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Username is too long (max 50 characters)" }
  }

  // Allow letters, numbers, underscores, hyphens, dots
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return { isValid: false, error: "Username contains invalid characters" }
  }

  return { isValid: true }
}

/**
 * Validate password strength
 * Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: "Password is required" }
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters" }
  }

  if (password.length > 255) {
    return { isValid: false, error: "Password is too long" }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one uppercase letter" }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one lowercase letter" }
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number" }
  }

  return { isValid: true }
}

/**
 * Validate movie title
 * @param {string} title - Title to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateMovieTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: "Movie title is required" }
  }

  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Movie title cannot be empty" }
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: "Movie title is too long (max 200 characters)" }
  }

  return { isValid: true }
}

/**
 * Validate hall name
 * @param {string} name - Name to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
exports.validateHallName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: "Hall name is required" }
  }

  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { isValid: false, error: "Hall name cannot be empty" }
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: "Hall name is too long (max 100 characters)" }
  }

  return { isValid: true }
}

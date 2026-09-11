export function validateComplaintForm(data) {
  const errors = {};
  if (!data.subject || data.subject.trim().length === 0) {
    errors.subject = 'Subject is required';
  }
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  if (!data.category_id) {
    errors.category_id = 'Category is required';
  }
  if (!data.priority) {
    errors.priority = 'Priority is required';
  }
  if (!data.channel) {
    errors.channel = 'Channel is required';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLoginForm(data) {
  const errors = {};
  if (!data.identifier || data.identifier.trim() === '') {
    errors.identifier = 'Email or username is required';
  }
  if (!data.password || data.password.trim() === '') {
    errors.password = 'Password is required';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRegisterForm(data) {
  const errors = {};
  if (!data.username || data.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  if (!data.password || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if (!data.full_name || data.full_name.trim() === '') {
    errors.full_name = 'Full name is required';
  }
  if (!data.email || !/^\S+@\S+\.\S+$/i.test(data.email)) {
    errors.email = 'Valid email address is required';
  }
  if (!data.confirmPassword || data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateFeedbackForm(data) {
  const errors = {};
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateEscalationForm(data) {
  const errors = {};
  if (!data.reason || data.reason.trim().length < 10) {
    errors.reason = 'Reason must be at least 10 characters';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateResolutionForm(data) {
  const errors = {};
  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

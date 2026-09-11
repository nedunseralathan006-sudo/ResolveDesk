export const validateRequest = (schema) => {
  return (req, res, next) => {
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        return res.status(400).json({ error: rules.message || `${field} is required.` });
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rules.type) {
          if (rules.type === 'integer' && !Number.isInteger(Number(value))) {
            return res.status(400).json({ error: rules.message || `${field} must be an integer.` });
          }
          if (rules.type === 'string' && typeof value !== 'string') {
            return res.status(400).json({ error: rules.message || `${field} must be a string.` });
          }
        }

        if (rules.values && !rules.values.includes(value)) {
          return res.status(400).json({ error: rules.message || `${field} must be one of: ${rules.values.join(', ')}.` });
        }

        if (rules.min !== undefined && String(value).length < rules.min) {
          return res.status(400).json({ error: rules.message || `${field} must be at least ${rules.min} characters.` });
        }

        if (rules.max !== undefined && String(value).length > rules.max) {
          return res.status(400).json({ error: rules.message || `${field} must be at most ${rules.max} characters.` });
        }

        if (rules.pattern && !rules.pattern.test(String(value))) {
          return res.status(400).json({ error: rules.message || `${field} format is invalid.` });
        }
      }
    }
    next();
  };
};

export const validateComplaint = validateRequest({
  subject: { required: true, type: 'string', min: 3, max: 200, message: 'Subject is required and must be between 3 and 200 characters.' },
  description: { required: true, type: 'string', min: 10, message: 'Description is required and must be at least 10 characters.' },
  category_id: { required: true, type: 'integer', message: 'Category ID is required and must be an integer.' },
  priority: { required: true, type: 'string', values: ['low', 'medium', 'high', 'critical'], message: 'Priority must be one of: low, medium, high, critical.' },
  channel: { required: true, type: 'string', values: ['phone', 'email', 'website', 'in-person', 'other'], message: 'Channel must be valid.' },
  customer_name: { required: false, type: 'string' },
  contact_info: { required: false, type: 'string' }
});

export const validateFeedback = validateRequest({
  rating: { required: true, type: 'integer', message: 'Rating is required and must be an integer between 1 and 5.', pattern: /^[1-5]$/ },
  comment: { required: false, type: 'string' }
});

export const validateAssignment = validateRequest({
  agent_id: { required: true, type: 'integer', message: 'Agent ID is required and must be an integer.' }
});

export const validateEscalation = validateRequest({
  reason: { required: true, type: 'string', min: 10, message: 'Reason is required and must be at least 10 characters.' }
});

export const validateResolution = validateRequest({
  description: { required: true, type: 'string', min: 10, message: 'Resolution description is required and must be at least 10 characters.' }
});

export const validateStatusUpdate = validateRequest({
  status: { required: true, type: 'string', values: ['assigned', 'in_progress', 'escalated', 'resolved', 'closed'], message: 'Valid status is required.' }
});

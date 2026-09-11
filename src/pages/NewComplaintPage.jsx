import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import { createComplaint, getCategories } from '../services/api';
import { PRIORITIES, CHANNELS, PRIORITY_LABELS, CHANNEL_LABELS } from '../utils/constants';
import { useToast } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category_id: '',
    priority: PRIORITIES.LOW,
    channel: CHANNELS.WEBSITE,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setFormData(f => ({ ...f, category_id: cats[0].id }));
      })
      .catch(() => showError('Failed to load categories'))
      .finally(() => setCatLoading(false));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(errs => ({ ...errs, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      errs.subject = 'Subject must be at least 3 characters.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }
    if (!formData.category_id) {
      errs.category_id = 'Please select a category.';
    }
    if (!formData.priority) {
      errs.priority = 'Please select a priority.';
    }
    if (!formData.channel) {
      errs.channel = 'Please select a channel.';
    }
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setErrors({});
    setLoading(true);
    try {
      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
      };
      const data = await createComplaint(payload);
      setSuccessData(data);
    } catch (err) {
      showError(err.message || 'Failed to register complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (catLoading) return <LoadingSpinner />;

  if (successData) {
    return (
      <>
        <Header title="Complaint Registered">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </Header>
        <div className="content-scroll">
          <div className="page-content" style={{ maxWidth: '600px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }}>✓</div>
              <h2 style={{ marginBottom: '0.5rem' }}>Complaint Registered Successfully</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Your complaint has been received. Our team will review it shortly.
              </p>
              <div style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left'
              }}>
                <div className="detail-grid">
                  <div>
                    <div className="detail-label">Ticket ID</div>
                    <div className="detail-value" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {successData.ticket_id}
                    </div>
                  </div>
                  <div>
                    <div className="detail-label">Status</div>
                    <div className="detail-value">New — Awaiting Review</div>
                  </div>
                  <div>
                    <div className="detail-label">Priority</div>
                    <div className="detail-value" style={{ textTransform: 'capitalize' }}>
                      {successData.priority}
                    </div>
                  </div>
                  <div>
                    <div className="detail-label">SLA Target</div>
                    <div className="detail-value">{successData.sla_hours} hours</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setSuccessData(null); setFormData({ subject: '', description: '', category_id: categories[0]?.id || '', priority: PRIORITIES.LOW, channel: CHANNELS.WEBSITE }); }}
                >
                  Register Another
                </button>
                <button
                  id="btn-view-ticket"
                  className="btn btn-primary"
                  onClick={() => navigate(`/tickets/${successData.ticket_id}`)}
                >
                  View Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="New Complaint" subtitle="Fill in the form below to register your complaint">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </Header>
      <div className="content-scroll">
        <div className="page-content" style={{ maxWidth: '800px' }}>
          <div className="card">
            <form id="new-complaint-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  id="subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of the issue (min. 3 characters)"
                  maxLength={200}
                />
                {errors.subject && <div className="form-error">{errors.subject}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide a detailed explanation of the issue (min. 10 characters)..."
                  style={{ minHeight: '140px' }}
                />
                {errors.description && <div className="form-error">{errors.description}</div>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category_id">Category *</label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <div className="form-error">{errors.category_id}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority *</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {Object.entries(PRIORITIES).map(([, v]) => (
                      <option key={v} value={v}>{PRIORITY_LABELS[v]}</option>
                    ))}
                  </select>
                  {errors.priority && <div className="form-error">{errors.priority}</div>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="channel">How did you contact us? *</label>
                <select
                  id="channel"
                  name="channel"
                  value={formData.channel}
                  onChange={handleChange}
                >
                  {Object.entries(CHANNELS).map(([, v]) => (
                    <option key={v} value={v}>{CHANNEL_LABELS[v]}</option>
                  ))}
                </select>
                {errors.channel && <div className="form-error">{errors.channel}</div>}
              </div>

              <div style={{
                display: 'flex', gap: '1rem', justifyContent: 'flex-end',
                marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem'
              }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/tickets')}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-complaint"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Register Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';

const emojis = [
  { label: 'Very Poor', icon: '😡', color: 'border-red-500', bg: 'bg-red-500' },
  { label: 'Poor', icon: '😟', color: 'border-orange-500', bg: 'bg-orange-500' },
  { label: 'Average', icon: '😐', color: 'border-yellow-500', bg: 'bg-yellow-500' },
  { label: 'Good', icon: '🙂', color: 'border-blue-500', bg: 'bg-blue-500' },
  { label: 'Excellent', icon: '😄', color: 'border-green-500', bg: 'bg-green-500' },
];

export const CustomerFeedback = () => {
  const { id } = useParams<{ id: string }>();
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === null) return;
    setIsSubmitting(true);
    try {
      await api.post(`/complaints/${id}/feedback`, { rating: rating + 1, comments });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-gray-500">Your feedback has been recorded and will help us improve our service.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Green Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-green-800">Complaint Resolved</h3>
          <p className="text-sm text-green-700 mt-1">This complaint was resolved on Sep 10, 2026.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">How was your experience?</h1>
        <p className="text-sm text-gray-500 mb-8">Your feedback helps us improve our service.</p>

        <div className="flex justify-center gap-4 sm:gap-6 mb-8">
          {emojis.map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => setRating(idx)}
              className={`flex flex-col items-center gap-2 group outline-none`}
            >
              <div 
                className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl rounded-full transition-all duration-200
                ${rating === idx ? 'ring-4 ring-offset-2 scale-110 ' + emoji.bg.replace('bg-', 'ring-') : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                {emoji.icon}
              </div>
              <span className={`text-xs sm:text-sm font-medium ${rating === idx ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                {emoji.label}
              </span>
            </button>
          ))}
        </div>

        <div className="text-left mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments (Optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-shadow text-sm resize-none"
            placeholder="Tell us what you liked or how we can improve..."
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          disabled={rating === null || isSubmitting}
          className="w-full sm:w-auto px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};

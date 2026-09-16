import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const complaintSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  contactInformation: z.string().min(5, 'Contact info is required'),
  category: z.string().min(1, 'Category is required'),
  subject: z.string().min(5, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  channel: z.string().min(1, 'Channel is required'),
});

type ComplaintForm = z.infer<typeof complaintSchema>;

export const RegisterComplaint = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ComplaintForm>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: '',
      channel: ''
    }
  });

  const onSubmit = async (data: ComplaintForm) => {
    try {
      await api.post('/complaints', data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      navigate('/complaints');
    } catch (error) {
      console.error('Failed to create complaint', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a new complaint for a customer</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow text-sm"
              {...register('customerName')}
            />
            {errors.customerName && <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
            <input
              type="text"
              placeholder="Email or phone number"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow text-sm"
              {...register('contactInformation')}
            />
            {errors.contactInformation && <p className="mt-1 text-sm text-red-600">{errors.contactInformation.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
              {...register('category')}
            >
              <option value="" disabled>Select category...</option>
              <option value="Product Issue">Product Issue</option>
              <option value="Billing">Billing</option>
              <option value="Shipping">Shipping</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow text-sm"
              {...register('subject')}
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-shadow text-sm resize-none"
              {...register('description')}
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
              {...register('channel')}
            >
              <option value="" disabled>Select channel...</option>
              <option value="Website">Website</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="In-Person">In-Person</option>
              <option value="Other">Other</option>
            </select>
            {errors.channel && <p className="mt-1 text-sm text-red-600">{errors.channel.message}</p>}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

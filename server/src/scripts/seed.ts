import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Complaint from '../models/Complaint';
import Activity from '../models/Activity';
import Notification from '../models/Notification';
import Feedback from '../models/Feedback';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/supporttrack';

const agents = [
  { name: 'Nedunseralathan', email: 'nedun@supporttrack.com', password: 'password123', role: 'admin' as const },
  { name: 'Nandini Rao', email: 'nandini@supporttrack.com', password: 'password123', role: 'agent' as const },
  { name: 'Rahul Kumar', email: 'rahul@supporttrack.com', password: 'password123', role: 'agent' as const },
  { name: 'Priya Sharma', email: 'priya@supporttrack.com', password: 'password123', role: 'agent' as const },
  { name: 'Arjun Mehta', email: 'arjun@supporttrack.com', password: 'password123', role: 'manager' as const },
];

const customers = [
  { name: 'Arjun Mehta', contact: 'arjun.mehta@example.com' },
  { name: 'Sneha Kapoor', contact: 'sneha.kapoor@example.com' },
  { name: 'Rohit Das', contact: 'rohit.das@example.com' },
  { name: 'Kanya Nair', contact: '+91 98765 43210' },
  { name: 'Arnav Verma', contact: 'arnav.verma@example.com' },
  { name: 'Pooja Singh', contact: 'pooja.singh@example.com' },
  { name: 'Vikram Patel', contact: '+91 87654 32109' },
  { name: 'Deepika Joshi', contact: 'deepika.joshi@example.com' },
  { name: 'Sanjay Gupta', contact: '+91 76543 21098' },
  { name: 'Meera Reddy', contact: 'meera.reddy@example.com' },
  { name: 'Rajesh Iyer', contact: 'rajesh.iyer@example.com' },
  { name: 'Ananya Bose', contact: '+91 65432 10987' },
  { name: 'Kartik Agarwal', contact: 'kartik.agarwal@example.com' },
  { name: 'Lakshmi Menon', contact: 'lakshmi.menon@example.com' },
  { name: 'Naveen Choudhary', contact: '+91 54321 09876' },
];

const categories = ['Product Issue', 'Billing', 'Account', 'Feature Request', 'Technical Issue', 'Service Issue', 'Other'] as const;
const channels = ['Website', 'Email', 'Phone', 'Mobile App', 'In-Person', 'Other'] as const;
const statuses = ['Open', 'In Progress', 'Resolved', 'Escalated', 'Closed'] as const;
const priorities = ['Low', 'Medium', 'High', 'Critical'] as const;

const subjects = [
  'Product not working as expected',
  'Refund not processed',
  'Login issue',
  'Damaged product received',
  'Feature request for mobile app',
  'Payment failure on checkout',
  'Cannot access account',
  'Slow website loading',
  'Wrong item delivered',
  'Subscription billing error',
  'App crashes on launch',
  'Unable to reset password',
  'Delivery delayed by 2 weeks',
  'Quality issue with product',
  'Need invoice for purchase',
  'Missing order confirmation email',
  'Product warranty claim',
  'Service appointment not scheduled',
  'Duplicate charge on credit card',
  'Account locked after multiple attempts',
  'Request for product demonstration',
  'Integration API not responding',
  'Data export feature not working',
  'Notification settings not saving',
  'Profile update failing',
  'Search function returning wrong results',
  'Dashboard data not loading',
  'Report generation timeout',
  'Email notifications not received',
  'Mobile app sync issues',
  'Browser compatibility problem',
  'SSL certificate warning',
  'Two-factor authentication issue',
  'Bulk upload feature broken',
  'Custom report template error',
  'API rate limiting too strict',
  'Webhook delivery failures',
  'User permission not working correctly',
  'Calendar integration broken',
  'File attachment upload fails',
];

const descriptions = [
  'The product stops working after a few hours of usage. Tried resetting but the issue persists.',
  'I requested a refund 10 days ago but it has not been processed yet. Order ID: #ORD-4521.',
  'I am unable to log in to my account. The system says my credentials are invalid even though I am sure they are correct.',
  'The product arrived with visible damage to the packaging and the product itself. Attached photos for reference.',
  'It would be great if the mobile app had a dark mode feature. Many users have been requesting this.',
  'Payment keeps failing at the checkout page. I have tried multiple cards and payment methods.',
  'My account has been locked and I cannot access any of my data. Need urgent assistance.',
  'The website takes over 30 seconds to load on both desktop and mobile. This started happening recently.',
  'Received a completely different item from what I ordered. Order number: #ORD-7832.',
  'I was charged twice for my monthly subscription. Please refund the duplicate charge.',
  'The mobile app crashes immediately after opening. I have tried reinstalling it twice.',
  'The password reset email is not being received. I have checked my spam folder as well.',
  'My delivery was supposed to arrive 2 weeks ago but there has been no update on tracking.',
  'The product quality is significantly lower than what was advertised on the website.',
  'I need a GST invoice for my recent purchase. The auto-generated receipt does not include GST details.',
  'I placed an order yesterday but did not receive any confirmation email or SMS.',
  'My product is within the warranty period and I would like to file a warranty claim for repair.',
  'I booked a service appointment last week but it was never scheduled. Need immediate attention.',
  'I see two charges of the same amount on my credit card statement for a single purchase.',
  'My account got locked after I entered the wrong password a few times. Need help unlocking it.',
];

function randomDate(startDays: number, endDays: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const agent of agents) {
      const user = await User.create(agent);
      createdUsers.push(user);
      console.log(`Created user: ${agent.name} (${agent.email})`);
    }

    const agentUsers = createdUsers.filter(u => u.role === 'agent');

    // Create complaints
    const complaintCount = 45;
    const statusWeights = { 'Open': 0.25, 'In Progress': 0.3, 'Resolved': 0.25, 'Escalated': 0.1, 'Closed': 0.1 };
    const priorityWeights = { 'Low': 0.2, 'Medium': 0.35, 'High': 0.3, 'Critical': 0.15 };

    function weightedPick<T extends string>(weights: Record<T, number>): T {
      const rand = Math.random();
      let cumulative = 0;
      for (const [key, weight] of Object.entries(weights) as [T, number][]) {
        cumulative += weight;
        if (rand <= cumulative) return key;
      }
      return Object.keys(weights)[0] as T;
    }

    for (let i = 0; i < complaintCount; i++) {
      const customer = pick(customers);
      const status = weightedPick(statusWeights);
      const priority = weightedPick(priorityWeights);
      const category = pick(categories);
      const channel = pick(channels);
      const subjectIndex = i % subjects.length;
      const descIndex = i % descriptions.length;
      const createdAt = randomDate(30, 0);

      const assignedAgent = Math.random() > 0.15 ? pick(agentUsers) : undefined;

      const slaHours = { 'Critical': 4, 'High': 8, 'Medium': 24, 'Low': 48 }[priority];
      const slaDeadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);

      const complaintData: any = {
        complaintId: `C-${(i + 1).toString().padStart(5, '0')}`,
        customerName: customer.name,
        contactInformation: customer.contact,
        category,
        subject: subjects[subjectIndex],
        description: descriptions[descIndex],
        channel,
        status,
        priority,
        assignedTo: assignedAgent?._id,
        slaDeadline,
        createdAt,
        updatedAt: createdAt,
      };

      if (status === 'Resolved' || status === 'Closed') {
        complaintData.resolvedAt = new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000);
      }
      if (status === 'Closed') {
        complaintData.closedAt = new Date((complaintData.resolvedAt || createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000);
      }
      if (status === 'Escalated') {
        complaintData.escalatedAt = new Date(createdAt.getTime() + Math.random() * 12 * 60 * 60 * 1000);
      }

      const complaint = await Complaint.create(complaintData);

      // Create activity: complaint created
      await Activity.create({
        complaintId: complaint._id,
        userId: createdUsers[0]._id,
        type: 'created',
        message: 'Complaint created',
        createdAt: createdAt,
      });

      // If assigned, create assignment activity
      if (assignedAgent) {
        await Activity.create({
          complaintId: complaint._id,
          userId: createdUsers[0]._id,
          type: 'assigned',
          message: `Assigned to ${assignedAgent.name}`,
          createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        });

        await Notification.create({
          userId: assignedAgent._id,
          message: `Complaint ${complaint.complaintId} assigned to you`,
          type: 'assignment',
          complaintId: complaint._id,
          read: Math.random() > 0.5,
          createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        });
      }

      // If status changed, create activity
      if (status !== 'Open') {
        await Activity.create({
          complaintId: complaint._id,
          userId: assignedAgent?._id || createdUsers[0]._id,
          type: 'status_change',
          message: `Status changed from Open to ${status}`,
          createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        });
      }

      // Add feedback for some resolved/closed complaints
      if ((status === 'Resolved' || status === 'Closed') && Math.random() > 0.4) {
        await Feedback.create({
          complaintId: complaint._id,
          rating: Math.floor(Math.random() * 5) + 1,
          comment: pick([
            'Great support, issue resolved quickly!',
            'Took a bit long but got resolved eventually.',
            'Average experience, could be better.',
            'Very satisfied with the resolution.',
            'Not happy with the response time.',
            'Excellent customer service!',
            undefined,
          ]),
          createdAt: new Date((complaintData.resolvedAt || createdAt).getTime() + 2 * 60 * 60 * 1000),
        });
      }
    }

    console.log(`\nSeeded ${complaintCount} complaints with activities, notifications, and feedback.`);
    console.log('\n--- Demo Credentials ---');
    console.log('Admin:   nedun@supporttrack.com / password123');
    console.log('Agent:   nandini@supporttrack.com / password123');
    console.log('Agent:   rahul@supporttrack.com / password123');
    console.log('Manager: arjun@supporttrack.com / password123');
    console.log('------------------------\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();

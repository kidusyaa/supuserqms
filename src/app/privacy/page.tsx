// app/privacy/page.tsx
import {
  Mail,
  Globe,
  Database,
  Users,
  ShieldCheck,
  BookUser,
  History,
  Cookie,
  FileText,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

// For legal documents, it's best to hardcode the "Last Updated" date
// Using new Date() can cause hydration errors in Next.js
const lastUpdatedDate = 'October 31, 2025'; 

// Organize sections into a data structure for easier management
const policySections = [
  {
    id: 'info-collection',
    icon: Database,
    title: '1. Information We Collect',
    content: (
      <>
        <p>We collect the following types of information to provide and improve our services:</p>
        <h3>a. Personal Information</h3>
        <p>When you create an account or use our services, we may collect:</p>
        <ul>
          <li>Full name, Email address, Phone number</li>
          <li>Gender & Profile picture (optional)</li>
          <li>Company or business details (for service providers)</li>
        </ul>
        <h3>b. Booking Information</h3>
        <ul>
          <li>Appointment details (date, time, service)</li>
          <li>Location data (only if you enable it to find nearby services)</li>
        </ul>
        <h3>c. Technical Information</h3>
        <ul>
          <li>Device information (type, browser, OS), IP address</li>
          <li>Cookies and similar technologies to improve user experience</li>
        </ul>
      </>
    ),
  },
  {
    id: 'info-use',
    icon: Users,
    title: '2. How We Use Your Information',
    content: (
      <>
        <p>Your information is used to:</p>
        <ul>
          <li>Provide, manage, and improve our platform</li>
          <li>Process bookings and manage queues</li>
          <li>Communicate with you (reminders, updates, promotions)</li>
          <li>Help companies manage their services and customer data</li>
          <li>Ensure security, prevent fraud, and resolve issues</li>
        </ul>
        <p><strong>We do not sell or rent your personal data to third parties.</strong></p>
      </>
    ),
  },
  {
    id: 'info-sharing',
    icon: Users,
    title: '3. How We Share Your Information',
    content: (
       <>
          <p>We may share information:</p>
          <ul>
            <li>With registered companies when you make a booking or join a queue</li>
            <li>With service providers who help us operate (e.g., hosting, analytics, messaging services)</li>
            <li>When required by law or to protect our rights</li>
          </ul>
          <p>All shared partners must respect your privacy and comply with data protection laws.</p>
      </>
    ),
  },
  {
    id: 'data-security',
    icon: ShieldCheck,
    title: '4. Data Security',
    content: (
      <p>We use appropriate security measures to protect your personal data against unauthorized access, loss, or misuse. However, please note that no system is 100% secure online.</p>
    ),
  },
  {
    id: 'data-retention',
    icon: History,
    title: '5. Data Retention',
    content: (
      <p>We keep your data as long as your account is active or as needed to provide our services. You can request deletion of your data anytime by contacting us.</p>
    ),
  },
   {
    id: 'your-rights',
    icon: BookUser,
    title: '6. Your Rights',
    content: (
      <>
        <p>Depending on local laws, you may:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct or update your data</li>
            <li>Request deletion of your account and data</li>
            <li>Opt out of promotional messages</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:info@gizebook.com">info@gizebook.com</a>.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: '7. Cookies',
    content: (
      <p>We use cookies to improve functionality and personalize your experience. You can control cookies through your browser settings.</p>
    ),
  },
  {
    id: 'policy-changes',
    icon: Bell,
    title: '8. Changes to This Policy',
    content: (
      <p>We may update this Privacy Policy from time to time. We will notify users of major changes by email or by posting a notice on the website.</p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-pattern min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Page Header */}
        <div className="text-center mb-16">
          <FileText className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Last Updated: <span className="font-semibold text-amber-600">{lastUpdatedDate}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-12">
          {/* Sticky Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-1">
            <nav className="sticky top-24 space-y-2">
              {policySections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="privacy-nav-link">
                  <section.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{section.title}</span>
                </a>
              ))}
               <a href="#contact" className="privacy-nav-link">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <span>Contact Us</span>
                </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="space-y-12">
              {policySections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <div className="flex items-center gap-4">
                     <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
                       <section.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                     </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
                  </div>
                  <div className="prose prose-lg dark:prose-invert prose-a:text-amber-600 hover:prose-a:text-amber-700 max-w-none mt-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                    {section.content}
                  </div>
                </section>
              ))}

              {/* Contact Section */}
              <section id="contact" className="scroll-mt-24">
                  <div className="flex items-center gap-4">
                     <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
                       <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                     </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">9. Contact Us</h2>
                  </div>
                <div className="mt-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    If you have questions about this Privacy Policy or how your information is handled, please contact us:
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-8">
                      <Link href="mailto:info@gizebook.com" className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors">
                        <Mail className="h-5 w-5" /> info@gizebook.com
                      </Link>
                      <Link href="https://gizebook.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-medium transition-colors">
                        <Globe className="h-5 w-5" /> www.gizebook.com
                      </Link>
                  </div>
                </div>
              </section>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
import { ShieldCheck, Scale, Cookie, ScrollText, Mail } from "lucide-react";
import { PageHeader } from "../components/PageHeader.jsx";

function LegalLayout({ icon: Icon, title, lastUpdated, children }) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">{title}</h1>
          {lastUpdated && <p className="text-sm text-ink-muted mt-1">Last Updated: {lastUpdated}</p>}
        </div>
      </div>
      <div className="prose prose-sm sm:prose-base prose-slate max-w-none prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-soft prose-a:text-brand-600">
        {children}
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout icon={ShieldCheck} title="Privacy Policy" lastUpdated="August 29, 2026">
      <h2>1. Introduction</h2>
      <p>
        Welcome to Ken Academy. We respect your privacy and are committed to protecting your personal data.
        This privacy policy will inform you as to how we look after your personal data when you visit our website
        (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
      </p>
      
      <h2>2. The Data We Collect About You</h2>
      <p>
        Personal data, or personal information, means any information about an individual from which that person can be identified.
        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
      </p>
      <ul>
        <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
        <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
        <li><strong>Financial Data</strong> includes payment card details (processed securely by our payment providers, not stored on our servers).</li>
        <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
        <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
      </ul>

      <h2>3. How We Use Your Personal Data</h2>
      <p>
        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
      </p>
      <ul>
        <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
        <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
        <li>Where we need to comply with a legal or regulatory obligation.</li>
      </ul>

      <h2>4. Data Security</h2>
      <p>
        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
        In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
      </p>

      <h2>5. Contact Us</h2>
      <p>
        If you have any questions about this privacy policy or our privacy practices, please contact us at kenacademy7@gmail.com.
      </p>
    </LegalLayout>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalLayout icon={Scale} title="Terms of Service" lastUpdated="August 29, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using the Ken Academy platform ("Service"), you agree to be bound by these Terms of Service.
        If you do not agree to these terms, please do not use our Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Ken Academy provides educational content, mock tests, and daily practice materials for competitive exam preparation.
        We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without notice.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        To access certain features of the Service, you must register for an account. You are responsible for maintaining the
        confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us
        immediately of any unauthorized use of your account.
      </p>

      <h2>4. Prohibited Conduct</h2>
      <p>
        You agree not to engage in any of the following activities:
      </p>
      <ul>
        <li>Copying, distributing, or disclosing any part of the Service in any medium.</li>
        <li>Using any automated system, including without limitation "robots," "spiders," "offline readers," etc., to access the Service.</li>
        <li>Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions to or from the servers running the Service.</li>
        <li>Uploading invalid data, viruses, worms, or other software agents through the Service.</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        The Service and its original content, features, and functionality are and will remain the exclusive property of Ken Academy and its licensors.
        The Service is protected by copyright, trademark, and other laws of both India and foreign countries.
      </p>

      <h2>6. Termination</h2>
      <p>
        We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion,
        for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
      </p>
    </LegalLayout>
  );
}

export function CookiePolicyPage() {
  return (
    <LegalLayout icon={Cookie} title="Cookie Policy" lastUpdated="August 29, 2026">
      <h2>1. What Are Cookies</h2>
      <p>
        As is common practice with almost all professional websites, this site uses cookies, which are tiny files that are downloaded to your computer, to improve your experience.
        This page describes what information they gather, how we use it, and why we sometimes need to store these cookies.
      </p>

      <h2>2. How We Use Cookies</h2>
      <p>
        We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site.
      </p>
      <ul>
        <li><strong>Account related cookies:</strong> If you create an account with us, then we will use cookies for the management of the signup process and general administration.</li>
        <li><strong>Login related cookies:</strong> We use cookies when you are logged in so that we can remember this fact. This prevents you from having to log in every single time you visit a new page.</li>
        <li><strong>Site preferences cookies:</strong> In order to provide you with a great experience on this site, we provide the functionality to set your preferences for how this site runs when you use it.</li>
      </ul>

      <h2>3. Third Party Cookies</h2>
      <p>
        In some special cases, we also use cookies provided by trusted third parties. The following section details which third party cookies you might encounter through this site.
      </p>
      <ul>
        <li>This site uses Google Analytics which is one of the most widespread and trusted analytics solutions on the web for helping us to understand how you use the site and ways that we can improve your experience.</li>
        <li>We also use secure payment gateways (e.g., Razorpay) which may set cookies to process payments securely and prevent fraud.</li>
      </ul>
    </LegalLayout>
  );
}

export function RefundPolicyPage() {
  return (
    <LegalLayout icon={ScrollText} title="Refund & Cancellation Policy" lastUpdated="August 29, 2026">
      <h2>1. Digital Products & Services</h2>
      <p>
        Given the nature of digital educational content (mock tests, videos, study materials) which are instantly accessible upon purchase,
        we generally do not offer refunds once a purchase has been completed and access has been granted.
      </p>

      <h2>2. Exceptions</h2>
      <p>
        Refunds may be considered under the following exceptional circumstances:
      </p>
      <ul>
        <li>If you were charged multiple times for the same transaction due to a technical error.</li>
        <li>If the content purchased is completely inaccessible due to prolonged technical issues on our end that we cannot resolve within a reasonable timeframe.</li>
      </ul>

      <h2>3. Cancellation</h2>
      <p>
        If you are on a recurring subscription plan, you may cancel your subscription at any time from your Account Settings.
        Cancellation will take effect at the end of the current billing cycle, and you will not be charged again. You will retain access to the Service until the current billing cycle ends.
      </p>

      <h2>4. How to Request a Refund</h2>
      <p>
        To request a refund under the exceptional circumstances listed above, please contact our support team at kenacademy7@gmail.com with your transaction details within 7 days of purchase.
      </p>
    </LegalLayout>
  );
}

export function ContactSupportPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center shrink-0">
          <Mail size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">Contact Support</h1>
          <p className="text-sm text-ink-muted mt-1">We're here to help you succeed.</p>
        </div>
      </div>
      
      <div className="card p-6 shadow-soft">
        <p className="text-ink-soft mb-6">
          Have a question about your account, payment, or finding the right study material? 
          Drop us a message and our team will get back to you within 24 hours.
        </p>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Support request sent! We will contact you shortly."); }}>
          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Your Name</label>
            <input type="text" className="input" placeholder="John Doe" required />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Email Address</label>
            <input type="email" className="input" placeholder="john@example.com" required />
          </div>
          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Subject</label>
            <select className="input" required>
              <option value="">Select a topic...</option>
              <option value="payment">Payment Issue</option>
              <option value="account">Account / Login Issue</option>
              <option value="content">Course Content Question</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-soft mb-1.5 block">Message</label>
            <textarea className="input min-h-[120px] resize-y" placeholder="How can we help?" required></textarea>
          </div>
          <button type="submit" className="btn-primary w-full py-3 mt-2">Send Message</button>
        </form>

        <div className="mt-8 pt-6 border-t border-black/5">
          <h3 className="font-bold text-ink mb-2">Direct Contact</h3>
          <p className="text-sm text-ink-soft">
            Email: <a href="mailto:kenacademy7@gmail.com" className="text-brand-600 hover:underline">kenacademy7@gmail.com</a><br/>
            Phone: +91 7530015494 (Mon-Fri, 9am - 6pm IST)
          </p>
        </div>
      </div>
    </div>
  );
}

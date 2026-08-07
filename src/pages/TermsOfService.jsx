import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[var(--vx-bg)] text-[var(--vx-text)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Arial, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: 'rgba(255,214,10,.08)', border: '1px solid #8A7300' }}>
            <FileText className="w-5 h-5" style={{ color: '#FFD60A' }} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--vx-faint)' }}>Legal</p>
            <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
          </div>
        </div>
        <p className="text-sm mb-10" style={{ color: 'var(--vx-muted)' }}>Last updated: August 7, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed" style={{ color: 'var(--vx-text)' }}>
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              By accessing or using the Xtreme Floor Visualizer platform, you agree to be bound by these Terms of Service. If you do not agree, you may not access or use the platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              Xtreme Floor Visualizer provides tools for surface coating visualization, project estimation, lead management, proposal generation, and business operations. We reserve the right to modify, suspend, or discontinue any feature at any time without notice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">3. Account Responsibilities</h2>
            <ul className="space-y-2 list-disc pl-5" style={{ color: 'var(--vx-muted)' }}>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must provide accurate and current information</li>
              <li>You are responsible for all activity under your account</li>
              <li>You must be at least 16 years old to use the platform</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">4. Acceptable Use</h2>
            <p style={{ color: 'var(--vx-muted)' }} className="mb-3">You agree not to:</p>
            <ul className="space-y-2 list-disc pl-5" style={{ color: 'var(--vx-muted)' }}>
              <li>Use the platform for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to access data or systems you are not authorized to access</li>
              <li>Interfere with or disrupt the platform's security or functionality</li>
              <li>Reproduce, duplicate, or resell the platform without permission</li>
              <li>Use automated systems to scrape or extract data in violation of our policies</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">5. Quotes and Estimates</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              All quotes, estimates, and pricing generated through the platform are approximate and subject to change based on project specifics, material availability, and market conditions. Final pricing is determined through formal proposal acceptance.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">6. Payments</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              Certain features may require payment. Payments are processed through Base44 Payments. You agree to pay all applicable fees and authorize us to charge your payment method for services rendered. Refunds, where applicable, are handled per our refund policy.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">7. Intellectual Property</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              The platform, including its design, content, and software, is owned by Xtreme Floor Visualizer and protected by intellectual property laws. You retain ownership of content you submit, and grant us a license to use it to provide the services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">8. Disclaimers</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              The platform is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not guarantee that the platform will be uninterrupted, error-free, or secure.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">9. Limitation of Liability</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              To the fullest extent permitted by law, Xtreme Floor Visualizer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">10. Governing Law</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              These Terms are governed by the laws of the jurisdiction in which Xtreme Floor Visualizer operates, without regard to conflict of law principles.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">11. Changes to These Terms</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We may revise these Terms from time to time. Material changes will be posted on this page with an updated "Last updated" date. Continued use after changes constitutes acceptance.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contact</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              Questions about these Terms can be directed to the email associated with your Xtreme Floor Visualizer account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--vx-bg)] text-[var(--vx-text)]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Arial, sans-serif' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: 'rgba(240,244,11,.08)', border: '1px solid #7a7e08' }}>
            <Shield className="w-5 h-5" style={{ color: '#f0f40b' }} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--vx-faint)' }}>Legal</p>
            <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-sm mb-10" style={{ color: 'var(--vx-muted)' }}>Last updated: August 7, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed" style={{ color: 'var(--vx-text)' }}>
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We collect information you provide directly to us, such as your name, email address, phone number, and business details when you create an account, submit a lead, request a quote, or contact us. We also automatically collect certain usage data, including device information, IP address, and interaction data with the Xtreme Floor Visualizer platform.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc pl-5" style={{ color: 'var(--vx-muted)' }}>
              <li>To provide, operate, and maintain the Xtreme Floor Visualizer application and its features</li>
              <li>To process quotes, proposals, appointments, and payments</li>
              <li>To communicate with you about your account, projects, and updates</li>
              <li>To analyze usage and improve our services</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">3. Information Sharing</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We do not sell your personal information. We may share your information with service providers who support our operations (such as payment processors, email delivery, and cloud hosting), when required by law, or in connection with a business transfer. All third parties are bound by confidentiality obligations.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">4. Data Retention</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We retain your information for as long as your account is active or as needed to provide our services. We may retain certain data after account deletion where required by law or for legitimate business purposes such as fraud prevention and record-keeping.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              Depending on your location, you may have the right to access, correct, export, or delete your personal information. You may also have the right to object to certain processing or restrict the use of your data. To exercise these rights, contact us using the information below.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">6. Security</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We implement reasonable technical and organizational measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">7. Children's Privacy</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              Our services are not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us for removal.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">8. Changes to This Policy</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Continued use of the platform after changes constitutes acceptance.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-3">9. Contact Us</h2>
            <p style={{ color: 'var(--vx-muted)' }}>
              If you have questions about this Privacy Policy, please contact us at the email associated with your Xtreme Floor Visualizer account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
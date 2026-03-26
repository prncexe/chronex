export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mb-8 text-gray-600">Last updated: February 13, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="mb-4 text-gray-700">
              Welcome to chronex {`("we," "us," "our," or "Company")`}. We are committed to
              protecting your privacy and ensuring you have a positive experience on our platform.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit our website and use our services.
            </p>
            <p className="text-gray-700">
              Please read this Privacy Policy carefully. If you do not agree with our policies and
              practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">2. Information We Collect</h2>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">
              2.1 Information from OAuth Integration
            </h3>
            <p className="mb-4 text-gray-700">
              When you connect your accounts through our OAuth integration (Discord, Instagram,
              LinkedIn, Slack, Threads, YouTube), we collect:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>Your authorization code and access tokens</li>
              <li>Your profile information from connected platforms</li>
              <li>Your user ID and email address (where permitted)</li>
              <li>Permissions scopes you have authorized</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">
              2.2 Automatically Collected Information
            </h3>
            <p className="mb-4 text-gray-700">
              We automatically collect certain information about your device and how you interact
              with our services:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>Browser type, version, and operating system information</li>
              <li>IP address and location data</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referral sources and navigation patterns</li>
              <li>Device identifiers and cookies</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">
              2.3 Information You Provide
            </h3>
            <p className="text-gray-700">
              Any information you voluntarily submit through forms, feedback channels, or direct
              communication with us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p className="mb-4 text-gray-700">We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Authenticate and authorize your access to our services</li>
              <li>Enable integration between your connected social accounts</li>
              <li>Improve, personalize, and enhance your user experience</li>
              <li>Analyze usage patterns to improve our platform functionality</li>
              <li>Send transactional notifications and updates related to your account</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address fraudulent or security issues</li>
              <li>Comply with legal obligations and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              4. Sharing Your Information
            </h2>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">4.1 Third-Party Platforms</h3>
            <p className="mb-4 text-gray-700">
              We do not sell or rent your personal information to third parties. However, to provide
              our services, we connect with and share necessary information with:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>Discord, Instagram, LinkedIn, Slack, Threads, and YouTube</li>
              <li>
                These platforms receive only the information necessary for the OAuth authentication
                process
              </li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">4.2 Service Providers</h3>
            <p className="mb-4 text-gray-700">
              We may share information with trusted service providers who assist us in operating our
              website and conducting our business, subject to confidentiality agreements.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">4.3 Legal Requirements</h3>
            <p className="text-gray-700">
              We may disclose your information when required by law or when we believe in good faith
              that disclosure is necessary to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Comply with applicable laws, regulations, or court orders</li>
              <li>Enforce our Terms of Service and other agreements</li>
              <li>Protect the security and integrity of our services</li>
              <li>Protect the rights, privacy, safety, or property of users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">5. Data Security</h2>
            <p className="mb-4 text-gray-700">
              We implement comprehensive security measures to protect your personal information from
              unauthorized access, alteration, disclosure, and destruction. These measures include:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication protocols</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls limiting data to authorized personnel</li>
              <li>Compliance with industry security standards</li>
            </ul>
            <p className="text-gray-700">
              However, no method of transmission over the Internet is 100% secure. While we strive
              to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">6. Your Privacy Rights</h2>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">6.1 Access and Control</h3>
            <p className="mb-4 text-gray-700">
              You have the right to access, review, update, or delete your personal information. You
              can manage your connected accounts and revoke access at any time through your account
              settings.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">6.2 Revoke Access</h3>
            <p className="mb-4 text-gray-700">
              You can disconnect any integrated social account from your chronex account at any
              time. Please note that revoking access will prevent us from performing integrations
              with that platform.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-800">6.3 Opt-Out</h3>
            <p className="text-gray-700">
              You can opt out of receiving promotional communications by following the unsubscribe
              instructions in our emails or updating your notification preferences in your account
              settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              7. Cookies and Tracking Technologies
            </h2>
            <p className="mb-4 text-gray-700">
              We use cookies and similar tracking technologies to enhance your experience on our
              platform:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Session Cookies:</strong> Maintain your login session
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and preferences
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how you use our services
              </li>
            </ul>
            <p className="text-gray-700">
              You can control cookie preferences through your browser settings. Please note that
              disabling cookies may affect some functionality of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">8. OAuth Permissions</h2>
            <p className="mb-4 text-gray-700">
              When you authorize chronex to access your social media accounts, you grant us specific
              permissions. You can review and modify these permissions at any time through your
              account settings or by going to your privacy settings on the respective platform
              (Discord, Instagram, LinkedIn, Slack, Threads, YouTube).
            </p>
            <p className="text-gray-700">
              We only request the minimum permissions necessary to provide our services. We will
              never request permission to post on your behalf without explicit user action.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">9. {`Children's`} Privacy</h2>
            <p className="text-gray-700">
              Our services are not directed to individuals under the age of 13. We do not knowingly
              collect personal information from children under 13. If we learn that we have
              collected personal information from a child under 13, we will promptly delete such
              information and terminate the {`child's`} account. If you believe we have collected
              information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">10. Data Retention</h2>
            <p className="mb-4 text-gray-700">
              We retain your personal information for as long as your account is active or as
              necessary to provide our services. You can request deletion of your data at any time
              through your account settings.
            </p>
            <p className="text-gray-700">
              We may retain certain information for legal compliance, fraud prevention, and security
              purposes even after you request deletion. We will securely destroy your information
              when no longer needed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              11. International Data Transfers
            </h2>
            <p className="text-gray-700">
              If you are located outside the United States, please note that your information may be
              transferred to, stored in, and processed in countries other than your country of
              residence. These countries may have data protection laws that differ from your home
              country. By using our services, you consent to the transfer of your information to
              countries outside your country of residence, which may have different data protection
              rules.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              12. Changes to This Privacy Policy
            </h2>
            <p className="mb-4 text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, and other factors. We will notify you of
              significant changes by posting the updated policy on our website and updating the{' '}
              {`"Last
              updated"`}{' '}
              date at the top of this policy.
            </p>
            <p className="text-gray-700">
              Your continued use of our services after such modifications constitutes your
              acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">13. Contact Us</h2>
            <p className="mb-4 text-gray-700">
              If you have questions, concerns, or requests regarding this Privacy Policy or our
              privacy practices, please contact us at:
            </p>
            <div className="rounded-lg bg-gray-100 p-4 text-gray-700">
              <p className="mb-2">
                <strong>Email:</strong> privacy@chronex.app
              </p>
              <p className="mb-2">
                <strong>Website:</strong> https://chronex.app
              </p>
              <p>
                <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 30
                days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">14. Your Acknowledgment</h2>
            <p className="text-gray-700">
              By using chronex, you acknowledge that you have read and understood this Privacy
              Policy and agree to its terms. If you do not agree with our privacy practices, please
              do not use our services.
            </p>
          </section>
        </div>

        <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm text-gray-700">
            <strong>Disclaimer:</strong> This privacy policy is provided for informational purposes.
            Please consult with a legal professional to ensure compliance with applicable laws and
            regulations in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  )
}

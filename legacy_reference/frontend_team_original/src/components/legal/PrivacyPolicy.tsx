import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl text-gray-900">Privacy Policy</CardTitle>
              <p className="text-gray-600 mt-2">Privacy Policy - RGA Dashboard</p>
              <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Last updated: 13 November 2025</span>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-2 text-green-600" />
                Introduction
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  RGA Analytics Company Limited ("we", "us", or "our") is committed to safeguarding your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and protect personal information when you use the RGA Dashboard platform.
                </p>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                  <p className="text-green-800">
                    <strong>Our commitment:</strong> We comply with Thailand's Personal Data Protection Act (PDPA) and international
                    security best practices.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-2 text-blue-600" />
                1. Data We Collect
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">1.1 Information you provide directly</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Account details</h4>
                      <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Full name</li>
                        <li>• Email address</li>
                        <li>• Phone number</li>
                        <li>• Passwords (encrypted)</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Organization information</h4>
                      <ul className="text-purple-800 text-sm space-y-1">
                        <li>• Company / organization name</li>
                        <li>• Job title</li>
                        <li>• Business address</li>
                        <li>• Billing information</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">1.2 Information collected automatically</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="text-gray-700 space-y-2">
                      <li><strong>Usage data:</strong> pages viewed, time spent, clicks, and interactions</li>
                      <li><strong>Device data:</strong> device type, operating system, browser</li>
                      <li><strong>Network data:</strong> IP address, approximate location (city level)</li>
                      <li><strong>Cookies:</strong> to enable seamless sessions and remember preferences</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">1.3 Data from third parties</h3>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-orange-800 mb-2">
                      <strong>Social platform connections:</strong> when you link Google, Facebook, TikTok, or other integrations.
                    </p>
                    <ul className="text-orange-700 text-sm space-y-1">
                      <li>• Public profile attributes</li>
                      <li>• Profile photos</li>
                      <li>• Campaign metrics or insights (when permission is granted)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How we use data</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Delivering the service</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Create and manage accounts</li>
                      <li>• Provide requested analytics features</li>
                      <li>• Process marketing performance data</li>
                      <li>• Generate dashboards and reports</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Improving the platform</h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Analyze product usage</li>
                      <li>• Develop new capabilities</li>
                      <li>• Fix bugs and optimize performance</li>
                      <li>• Train AI recommendations responsibly</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Communication</h3>
                    <ul className="text-purple-800 text-sm space-y-1">
                      <li>• Send critical service notices</li>
                      <li>• Share updates or new features</li>
                      <li>• Provide customer success support</li>
                      <li>• Deliver marketing content with consent</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Security & compliance</h3>
                    <ul className="text-red-800 text-sm space-y-1">
                      <li>• Prevent fraud and abuse</li>
                      <li>• Detect unusual behavior</li>
                      <li>• Maintain infrastructure integrity</li>
                      <li>• Meet legal and regulatory duties</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-red-600" />
                3. Data sharing & disclosure
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    <strong>Core principle:</strong> We never sell, rent, or trade your personal information for advertising purposes.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-800">We may share data only when:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Service providers</h4>
                    <p className="text-gray-700 text-sm">
                      Trusted partners supporting hosting, payments, messaging, or analytics under confidentiality agreements.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Legal requirements</h4>
                    <p className="text-gray-700 text-sm">
                      When compelled by court order, subpoena, or applicable law.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Protecting rights</h4>
                    <p className="text-gray-700 text-sm">
                      To defend the rights, property, or safety of RGA, our users, or the public.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Business transactions</h4>
                    <p className="text-gray-700 text-sm">
                      During mergers, acquisitions, or asset transfers (you will be notified in advance).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data security</h2>
              <div className="space-y-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Safeguards we apply</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="text-green-800 space-y-2">
                      <li>• <strong>Encryption:</strong> TLS in transit and AES-256 at rest</li>
                      <li>• <strong>Access controls:</strong> role-based access plus MFA</li>
                      <li>• <strong>Network security:</strong> segmented infrastructure and monitoring</li>
                    </ul>
                    <ul className="text-green-800 space-y-2">
                      <li>• <strong>Backups:</strong> automated encrypted backups every day</li>
                      <li>• <strong>Audits:</strong> scheduled security reviews and penetration tests</li>
                      <li>• <strong>Training:</strong> staff complete annual security awareness programs</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800">
                    <strong>Incident response:</strong> If a data breach occurs, we will notify affected users and regulators within 72 hours.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your privacy rights</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Depending on your jurisdiction, you may exercise the following rights:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-900 mb-2">Core rights</h3>
                    <ul className="text-indigo-800 text-sm space-y-1">
                      <li>• <strong>Access:</strong> request a copy of the data we hold</li>
                      <li>• <strong>Correction:</strong> update inaccurate or incomplete data</li>
                      <li>• <strong>Deletion:</strong> ask us to erase personal data</li>
                      <li>• <strong>Portability:</strong> receive data in a structured format</li>
                    </ul>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-pink-900 mb-2">Additional rights</h3>
                    <ul className="text-pink-800 text-sm space-y-1">
                      <li>• <strong>Restriction:</strong> limit how we process certain data</li>
                      <li>• <strong>Objection:</strong> object to processing for specific purposes</li>
                      <li>• <strong>Withdraw consent:</strong> revoke consent at any time</li>
                      <li>• <strong>Complain:</strong> contact a supervisory authority</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <strong>How to exercise your rights:</strong> email privacy@rgadashboard.com with your request and we will respond within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies & tracking technologies</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 mb-2">Essential cookies</h3>
                    <p className="text-yellow-800 text-sm">
                      Required for authentication, security, and basic site functionality.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Analytics cookies</h3>
                    <p className="text-blue-800 text-sm">
                      Help us understand product usage and improve performance (used only with consent).
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2">Marketing cookies</h3>
                    <p className="text-purple-800 text-sm">
                      Enable personalized content or campaigns when you opt in.
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">
                  You can adjust cookie preferences through your browser settings at any time.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data retention</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Retention periods</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• <strong>Account records:</strong> as long as you are a customer plus 7 years (tax compliance)</li>
                    <li>• <strong>Usage analytics:</strong> 2 years to improve product performance</li>
                    <li>• <strong>Marketing data:</strong> until you withdraw consent</li>
                    <li>• <strong>Backups:</strong> encrypted rolling backups retained for 30 days</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International data transfers</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We use cloud infrastructure that may store or process data outside your home country. Whenever data leaves Thailand,
                  we implement safeguards aligned with global standards.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Protection measures:</strong> Standard Contractual Clauses (SCCs), vendor due diligence, and continuous security reviews.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-green-600" />
                Contact the Data Protection Officer
              </h2>
              <div className="bg-green-50 p-6 rounded-lg">
                <p className="text-green-700 mb-4">
                  If you have questions about this Privacy Policy or wish to exercise your rights, please reach out:
                </p>
                <div className="space-y-2 text-green-700">
                  <p><strong>Data Protection Officer (DPO):</strong> Somchai Jaidee</p>
                  <p><strong>Email:</strong> privacy@rgadashboard.com</p>
                  <p><strong>Phone:</strong> +66 (0)2-123-4567</p>
                  <p><strong>Mailing address:</strong> 123 Sukhumvit Road, Khlong Toei, Bangkok 10110, Thailand</p>
                </div>
                <div className="mt-4 p-3 bg-green-100 rounded">
                  <p className="text-green-800 text-sm">
                    <strong>Regulator contact:</strong> If you are unsatisfied with our response, you may contact the PDPC at www.pdpc.go.th.
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

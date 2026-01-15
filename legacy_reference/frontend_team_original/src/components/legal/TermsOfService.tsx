import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, FileText, Calendar, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Terms of Service - RGA Dashboard</title>
        <meta name="description" content="Terms of Service for RGA Dashboard - Real-time Analytics Platform. Read our terms and conditions for using our services." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://rga-dashboard.vercel.app/terms" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rga-dashboard.vercel.app/terms" />
        <meta property="og:title" content="Terms of Service - RGA Dashboard" />
        <meta property="og:description" content="Terms of Service for RGA Dashboard - Real-time Analytics Platform" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://rga-dashboard.vercel.app/terms" />
        <meta property="twitter:title" content="Terms of Service - RGA Dashboard" />
        <meta property="twitter:description" content="Terms of Service for RGA Dashboard - Real-time Analytics Platform" />
        
        {/* Verification Meta Tags - Add your verification code here when provided */}
        {/* <meta name="verification" content="your-verification-code-here" /> */}
        {/* <meta name="google-site-verification" content="your-google-verification-code" /> */}
        {/* <meta name="facebook-domain-verification" content="your-facebook-verification-code" /> */}
      </Helmet>
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
              <div className="mx-auto mb-4 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl text-gray-900">Terms & Conditions</CardTitle>
              <p className="text-gray-600 mt-2">Terms of Service - RGA Dashboard</p>
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
            
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                1. Acceptance of Terms
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using RGA Dashboard (the "Service") operated by RGA Analytics Company Limited ("we", "us", or "our"),
                  you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree,
                  please stop using the Service immediately.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>"Service"</strong> means the RGA Dashboard platform and all related offerings.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>"User"</strong> means any individual or entity that accesses or uses the Service.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>"Data"</strong> means any type of information uploaded, stored, or processed through the Service.</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Using the Service</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">3.1 License</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>We grant you a non-exclusive, non-transferable right to use the Service according to your selected plan.</li>
                  <li>You agree to use the Service only for lawful purposes and in compliance with these Terms.</li>
                  <li>You are responsible for ensuring that your use complies with all applicable regulations.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6">3.2 Restrictions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Do not use the Service for illegal, harmful, or abusive activities.</li>
                  <li>Do not attempt to gain unauthorized access to the platform or related systems.</li>
                  <li>Do not interfere with Service performance or security.</li>
                  <li>Do not copy, modify, resell, or distribute the Service without prior written consent.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that
                  occur under your account.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Provide accurate, current, and complete information when registering or updating your profile.</li>
                  <li>Notify us immediately of any unauthorized use or security incident.</li>
                  <li>We may suspend or terminate accounts that violate these Terms.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Privacy & Data</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We respect your privacy. Collection, use, and disclosure of personal data follow our
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline"> Privacy Policy</a>.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800">
                    <strong>Note:</strong> You retain ownership of the data you upload. We only access or process it to operate the Service
                    or as required by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees & Cancellation</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">6.1 Subscription</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Fees follow the pricing plan you select.</li>
                  <li>Billing is due in advance for each billing cycle.</li>
                  <li>We may adjust pricing with at least 30 days' notice.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mt-6">6.2 Cancellation</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>You may cancel at any time; cancellations take effect in the next billing cycle.</li>
                  <li>We may suspend or terminate the Service if you violate these Terms.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimer & Liability</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-yellow-800">
                    <strong>Important:</strong> The Service is provided "as is" without warranties of uninterrupted or error-free operation.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>We are not liable for indirect, incidental, or special damages.</li>
                  <li>Our total liability is limited to the fees you paid during the preceding 12 months.</li>
                  <li>We recommend backing up critical data regularly.</li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to the Terms</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We may update these Terms from time to time. Material updates will be communicated at least 30 days in advance.
                  Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  These Terms are governed by the laws of Thailand, and any dispute will fall under the exclusive jurisdiction of Thai courts.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-blue-600" />
                Contact
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  If you have questions about these Terms, reach us at:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Company:</strong> RGA Analytics Company Limited</p>
                  <p><strong>Email:</strong> legal@rgadashboard.com</p>
                  <p><strong>Website:</strong> https://rgadashboard.com</p>
                  <p><strong>Address:</strong> 123 Sukhumvit Road, Khlong Toei, Bangkok 10110, Thailand</p>
                </div>
              </div>
            </section>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

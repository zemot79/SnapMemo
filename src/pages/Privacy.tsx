import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-8 space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zro Kft collects information necessary to provide our video editing platform. This includes account information (email address, username), uploaded content (images, videos, audio files), usage data (features used, export settings), and technical information (browser type, device information, IP address). We collect this data to deliver and improve our services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information is used to operate the video editing platform, process your uploaded content, generate your video exports, maintain and improve our services, communicate important updates, provide customer support, and analyze usage patterns to enhance user experience. We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your uploaded content and project files are securely stored on our servers with industry-standard encryption. We implement technical and organizational measures to protect against unauthorized access, loss, or alteration of your data. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Content Ownership and Processing</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain full ownership of all content you upload to our platform. We process your content solely to provide video editing services—including applying effects, transitions, and exporting your final videos. Your content is not used for any other purpose, including training machine learning models or advertising.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your project data and uploaded content for as long as your account is active. If you cancel your subscription or delete your account, your data will be retained for 30 days to allow recovery, after which it will be permanently deleted from our systems. Exported videos remain available for download during this period.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform uses essential cookies to maintain your session and remember your preferences. We also use analytics cookies to understand how users interact with our service and identify areas for improvement. You can control cookie preferences through your browser settings, though disabling essential cookies may affect platform functionality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services for payment processing, analytics, and content delivery. These providers have access only to the information necessary to perform their functions and are obligated to maintain confidentiality. We carefully select partners who comply with data protection regulations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access your personal data, request corrections to inaccurate information, request deletion of your account and data, export your project files and content, and opt-out of non-essential communications. To exercise these rights, contact us through the platform's support channels.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zro Kft may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes via email or platform notification. Your continued use of the service after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact Zro Kft through our support channels available on the platform.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;

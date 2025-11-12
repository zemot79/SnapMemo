import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
            <h1 className="text-4xl font-bold">Terms & Conditions</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-8 space-y-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Zro Kft's video creation platform. By accessing and using our services, you agree to be bound by these Terms and Conditions. Our platform enables users to create, edit, and export professional videos using images, video clips, and audio files with an intuitive timeline-based editor.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zro Kft provides a comprehensive video editing and creation service that allows users to upload images and videos, arrange them on a timeline, add background music, set focal points, create clips, and export the final product. Our platform offers various quality presets and export options to suit your needs.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for all content you upload to our platform. You must ensure that you have the necessary rights and permissions for all images, videos, and audio files you use. You agree not to upload content that infringes on intellectual property rights, contains malicious code, or violates any applicable laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of all content you upload. By using our service, you grant Zro Kft a limited license to process, store, and manipulate your content solely for the purpose of providing our video editing services. The videos you create remain your intellectual property.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Premium Subscription</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our premium subscription service is offered at $1 per month and provides enhanced features including higher quality export options, priority processing, and additional storage capacity. Subscriptions automatically renew unless canceled before the next billing cycle.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zro Kft provides the service "as is" and makes no warranties regarding availability, performance, or results. We are not liable for any data loss, business interruption, or indirect damages arising from your use of our platform. Our total liability is limited to the amount you paid for our services in the past 12 months.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                Either party may terminate the service agreement at any time. Upon termination, your access to the platform will be revoked, and your content may be deleted after a grace period of 30 days. You may request a copy of your content before the deletion date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Zro Kft reserves the right to modify these Terms and Conditions at any time. We will notify users of significant changes via email or platform notifications. Continued use of the service after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms and Conditions, please contact Zro Kft through our support channels available on the platform.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;

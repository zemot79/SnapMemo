import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Crown, Zap, Clock, HardDrive, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const features = [
    {
      category: "Export Quality",
      free: "720p HD",
      premium: "4K Ultra HD"
    },
    {
      category: "Video Length",
      free: "Up to 2 minutes",
      premium: "Unlimited"
    },
    {
      category: "Storage Space",
      free: "500 MB",
      premium: "10 GB"
    },
    {
      category: "Watermark",
      free: true,
      premium: false
    },
    {
      category: "Export Speed",
      free: "Standard",
      premium: "Priority Fast"
    },
    {
      category: "Projects",
      free: "3 active projects",
      premium: "Unlimited projects"
    },
    {
      category: "Transitions",
      free: "6 basic transitions",
      premium: "20+ premium transitions"
    },
    {
      category: "Audio Library",
      free: "10 tracks",
      premium: "100+ royalty-free tracks"
    },
    {
      category: "Support",
      free: "Community",
      premium: "Priority email support"
    },
  ];

  const faqs = [
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! You can cancel your premium subscription at any time. You'll continue to have access to premium features until the end of your billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and debit cards. Payments are securely processed through Stripe."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! All new users start with our free plan, which you can use indefinitely. You can upgrade to premium at any time to unlock all features."
    },
    {
      question: "What happens to my projects if I downgrade?",
      answer: "Your existing projects remain safe. However, you'll be limited to 3 active projects and 500 MB storage. You can export or delete projects to stay within free plan limits."
    },
    {
      question: "Can I upgrade from free to premium anytime?",
      answer: "Absolutely! You can upgrade to premium at any time with just one click. Your premium features will be activated immediately."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 7-day money-back guarantee for premium subscriptions. If you're not satisfied within the first 7 days, contact us for a full refund."
    },
    {
      question: "Will my videos have watermarks on the free plan?",
      answer: "Yes, videos exported on the free plan will include a small Zro Kft watermark. Premium users can export videos without any watermarks."
    },
    {
      question: "Can I use premium features for commercial projects?",
      answer: "Yes! Premium subscribers have full commercial rights to all videos created with our platform, including the royalty-free music library."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free, upgrade when you need more power. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle className="text-2xl">Free</CardTitle>
              </div>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">720p HD export quality</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Up to 2 minute videos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">500 MB storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">3 active projects</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">6 basic transitions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">10 audio tracks</span>
                </div>
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Includes watermark</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-accent text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <CardTitle className="text-2xl">Premium</CardTitle>
              </div>
              <CardDescription>For serious content creators</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  $1
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">4K Ultra HD export quality</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Unlimited video length</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">10 GB storage</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Unlimited projects</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">20+ premium transitions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">100+ royalty-free tracks</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">No watermark</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Priority fast export</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Priority email support</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">Detailed Feature Comparison</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold bg-primary/5">
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-primary" />
                          Premium
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="p-4 font-medium">{feature.category}</td>
                        <td className="p-4 text-center text-muted-foreground">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? (
                              <Check className="w-5 h-5 text-primary mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            feature.free
                          )}
                        </td>
                        <td className="p-4 text-center bg-primary/5 font-medium">
                          {typeof feature.premium === 'boolean' ? (
                            feature.premium ? (
                              <Check className="w-5 h-5 text-primary mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            feature.premium
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Premium?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Export in stunning 4K Ultra HD without watermarks. Perfect for social media, YouTube, and professional presentations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Priority processing means your videos export faster. No waiting in queues, get your content ready to share instantly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <HardDrive className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Unlimited Creativity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No limits on video length or number of projects. Access premium transitions and 100+ royalty-free music tracks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 space-y-6">
          <h2 className="text-3xl font-bold">Ready to create amazing videos?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators who trust Zro Kft for their video editing needs. Start free, upgrade anytime.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button size="lg" variant="outline">
                Start Free
              </Button>
            </Link>
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Crown className="w-4 h-4 mr-2" />
              Go Premium for $1/mo
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing;

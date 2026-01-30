"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { ApiKeyModal } from "@/components/shared/api-key-modal";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { Logo } from "@/components/shared/logo";
import { PLATFORMS, PLATFORM_NAMES } from "@/lib/late-api";
import {
  Calendar,
  Clock,
  Image as ImageIcon,
  Share2,
  Server,
  Scale,
  ArrowRight,
  Moon,
  Sun,
  Github,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function LandingPage() {
  const router = useRouter();
  const { apiKey, hasHydrated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (hasHydrated && apiKey) {
      router.push("/dashboard");
    }
  }, [apiKey, hasHydrated, router]);

  // Don't render until hydrated to avoid flash
  if (!hasHydrated) {
    return null;
  }

  const features = [
    {
      icon: Calendar,
      title: "Visual Calendar",
      description: "See all your scheduled content at a glance",
    },
    {
      icon: Clock,
      title: "Smart Queue",
      description: "Set posting times once, auto-schedule the rest",
    },
    {
      icon: ImageIcon,
      title: "Media Support",
      description: "Upload images and videos up to 5GB",
    },
    {
      icon: Share2,
      title: "13 Platforms",
      description: "Instagram, TikTok, YouTube, X, LinkedIn & more",
    },
    {
      icon: Server,
      title: "Self-Hostable",
      description: "Deploy on your own infrastructure",
    },
    {
      icon: Scale,
      title: "MIT Licensed",
      description: "Free forever, no vendor lock-in",
    },
  ];

  const faqs = [
    {
      question: "What is LateWiz?",
      answer:
        "LateWiz is a free, open-source social media scheduling tool built on the Late API. It lets you schedule posts across 13 platforms from a single interface.",
    },
    {
      question: "Is LateWiz really free?",
      answer:
        "Yes! LateWiz is MIT licensed and completely free. You just need a Late API key (free tier available) to connect your social accounts.",
    },
    {
      question: "What platforms are supported?",
      answer:
        "Instagram, TikTok, YouTube, X (Twitter), LinkedIn, Facebook, Pinterest, Threads, Bluesky, Snapchat, Telegram, Discord, and Slack.",
    },
    {
      question: "Can I self-host LateWiz?",
      answer:
        "Absolutely. Clone the repo, add your Late API key, and deploy anywhere - Vercel, Netlify, your own server, etc.",
    },
    {
      question: "How do I get a Late API key?",
      answer:
        "Sign up at getlate.dev, create a project, and copy your API key. Free tier includes generous limits for personal use.",
    },
    {
      question: "Is my data secure?",
      answer:
        "LateWiz doesn't store your social media credentials. All authentication is handled securely through the Late API using OAuth.",
    },
  ];

  return (
    <div className="relative min-h-screen">

      {/* Header */}
      <header className="relative z-20 border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Logo size="md" />

          <div className="flex items-center gap-4">
            <a
              href="https://getlate.dev/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              Pricing
            </a>
            <a
              href="https://github.com/getlate-dev/latewiz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button onClick={() => setShowApiKeyModal(true)}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-20">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your social media
            <br />
            <span className="text-primary">scheduling wizard</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Schedule posts across 13 platforms with a single, beautiful interface.
            Open source, free to use, and powered by Late.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => setShowApiKeyModal(true)}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/getlate-dev/latewiz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="mt-16">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Supports 13 platforms
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
            {PLATFORMS.map((platform) => (
              <div
                key={platform}
                className="flex flex-col items-center gap-2 group"
                title={PLATFORM_NAMES[platform]}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-all duration-200 group-hover:bg-accent group-hover:scale-105">
                  <PlatformIcon
                    platform={platform}
                    size="lg"
                    showColor
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {PLATFORM_NAMES[platform]}
                </span>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-0 bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-4 text-muted-foreground">
              A complete scheduling solution for social media managers and marketers.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-20 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mt-4 text-muted-foreground">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="mt-12">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border py-4">
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="relative z-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Github className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Open Source</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              LateWiz is MIT licensed and free to use. Self-host it on your own
              infrastructure, contribute to the project, or just use it as-is.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <iframe
                src="https://ghbtns.com/github-btn.html?user=getlate-dev&repo=latewiz&type=star&count=true&size=large"
                frameBorder="0"
                scrolling="0"
                width="150"
                height="30"
                title="GitHub Stars"
              />
              <Button variant="outline" asChild>
                <a
                  href="https://docs.getlate.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the Docs
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-20 border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Built with{" "}
              <a
                href="https://getlate.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Late
              </a>
              {" "}API
            </p>
          </div>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal open={showApiKeyModal} onOpenChange={setShowApiKeyModal} />
    </div>
  );
}

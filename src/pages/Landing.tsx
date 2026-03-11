import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield, Lock, Eye, Key, Smartphone, Cloud, Clock, Star, ArrowRight, Check, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeAndLangToggle } from "@/components/ThemeAndLangToggle";

const FEATURES = [
  {
    icon: Lock,
    translationKey: "features.end_to_end"
  },
  {
    icon: Eye,
    translationKey: "features.secure_view"
  },
  {
    icon: Key,
    translationKey: "features.password_generator"
  },
  {
    icon: Smartphone,
    translationKey: "features.cross_platform"
  },
  {
    icon: Cloud,
    translationKey: "features.secure_sync"
  },
  {
    icon: Clock,
    translationKey: "features.expiration"
  }
];

const BENEFITS = [
  "benefits.item.1",
  "benefits.item.2",
  "benefits.item.3",
  "benefits.item.4",
  "benefits.item.5",
  "benefits.item.6"
];

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight">VaultKey</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeAndLangToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">{t('nav.sign_in')}</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">{t('nav.get_started')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <span>{t('hero.subtitle')}</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t('hero.title')}{" "}
              <span className="text-primary">{t('hero.title_highlight')}</span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground">
              {t('hero.description')}
            </p>
            
            <p className="mb-4 text-sm font-medium text-primary">
              {t('hero.subtitle_alt')}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="gap-2">
                <Link to="/auth">
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://github.com/webberstate/secure-your-worlds" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  {t('hero.secondary_cta')}
                </a>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t('hero.no_credit_card')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`${feature.translationKey}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`${feature.translationKey}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('benefits.title')}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {t('benefits.subtitle')}
              </p>
              
              <ul className="mt-8 space-y-4">
                {BENEFITS.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{t(benefit)}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-8" asChild>
                <Link to="/auth">
                  {t('benefits.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              {/* Mockup */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-mono font-semibold">VaultKey</span>
                </div>
                <div className="space-y-3">
                  {[
                    { title: "mockup.github", email: "mockup.email", category: "mockup.category.dev" },
                    { title: "mockup.aws", email: "mockup.admin", category: "mockup.category.finance" },
                    { title: "mockup.gmail", email: "mockup.me", category: "mockup.category.email" }
                  ].map((cred, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                      <div>
                        <p className="font-medium">{t(cred.title)}</p>
                        <p className="text-xs text-muted-foreground">{t(cred.email)}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {t(cred.category)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('cta.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t('cta.subtitle')}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">
                {t('cta.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-mono font-semibold">VaultKey</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

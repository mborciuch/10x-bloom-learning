import type { ReactNode } from "react";

export type HeroCtaVariant = "primary" | "secondary";

export interface HeroCta {
  label: string;
  href: string;
  variant: HeroCtaVariant;
  ariaLabel?: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
}

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon?: ReactNode | string;
}

export interface FeaturesGridProps {
  features: LandingFeature[];
}

export interface LearningStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

export interface HowItWorksProps {
  steps: LearningStep[];
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterProps {
  links: FooterLink[];
  copyrightLabel: string;
}

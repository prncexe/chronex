import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  Database,
  Globe,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import { getBaseUrl } from '@/utils/getBaseUrl'

const summaryCards = [
  {
    title: 'What we collect',
    description:
      'OAuth tokens, connected account details, device information, and anything you choose to send us directly.',
    icon: Database,
  },
  {
    title: 'Why we collect it',
    description:
      'To authenticate you, run platform integrations, keep the product secure, and improve scheduling workflows.',
    icon: ShieldCheck,
  },
  {
    title: 'Your control',
    description:
      'You can disconnect platforms, request changes, manage cookies, and reach us for privacy-related requests.',
    icon: UserRoundCheck,
  },
]

const policySections = [
  {
    id: 'introduction',
    label: '01',
    title: 'Introduction',
    body: [
      'Welcome to Chronex ("we," "us," "our," or the "Company"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.',
      'Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our services.',
    ],
  },
  {
    id: 'information-we-collect',
    label: '02',
    title: 'Information We Collect',
    groups: [
      {
        heading: 'OAuth integration data',
        intro:
          'When you connect your accounts through our OAuth integrations, we may collect the following:',
        items: [
          'Authorization codes and access tokens',
          'Profile information from connected platforms',
          'User ID and email address, where permitted',
          'Permission scopes you authorize',
        ],
      },
      {
        heading: 'Automatically collected information',
        intro:
          'We automatically collect certain information about your device and how you interact with our services:',
        items: [
          'Browser type, version, and operating system information',
          'IP address and general location data',
          'Pages visited and time spent on pages',
          'Referral sources and navigation patterns',
          'Device identifiers and cookies',
        ],
      },
      {
        heading: 'Information you provide directly',
        intro:
          'We also collect any information you voluntarily submit through forms, feedback channels, or direct communication with us.',
      },
    ],
  },
  {
    id: 'how-we-use-information',
    label: '03',
    title: 'How We Use Your Information',
    intro: 'We use the information we collect to:',
    items: [
      'Authenticate and authorize your access to our services',
      'Enable integration between your connected social accounts',
      'Improve, personalize, and enhance your user experience',
      'Analyze usage patterns to improve platform functionality',
      'Send transactional notifications and account updates',
      'Respond to inquiries and provide support',
      'Detect, prevent, and address fraud or security issues',
      'Comply with legal obligations and regulations',
    ],
  },
  {
    id: 'sharing-information',
    label: '04',
    title: 'Sharing Your Information',
    groups: [
      {
        heading: 'Third-party platforms',
        intro:
          'We do not sell or rent your personal information. To provide our services, we connect with and share necessary information with platforms such as Discord, Instagram, LinkedIn, Slack, Threads, and YouTube. These platforms receive only the information required for the OAuth authentication process.',
      },
      {
        heading: 'Service providers',
        intro:
          'We may share information with trusted service providers who help us operate our website and business, subject to confidentiality obligations.',
      },
      {
        heading: 'Legal requirements',
        intro:
          'We may disclose your information when required by law or when we believe in good faith that disclosure is necessary to:',
        items: [
          'Comply with applicable laws, regulations, or court orders',
          'Enforce our Terms of Service and other agreements',
          'Protect the security and integrity of our services',
          'Protect the rights, privacy, safety, or property of users',
        ],
      },
    ],
  },
  {
    id: 'data-security',
    label: '05',
    title: 'Data Security',
    intro:
      'We implement security measures to protect your personal information from unauthorized access, alteration, disclosure, and destruction. These measures include:',
    items: [
      'Encryption of data in transit and at rest',
      'Secure authentication protocols',
      'Regular security audits and vulnerability assessments',
      'Access controls that limit data to authorized personnel',
      'Alignment with industry security standards',
    ],
    body: [
      'However, no method of transmission over the internet is completely secure. While we strive to protect your personal information, we cannot guarantee absolute security.',
    ],
  },
  {
    id: 'your-rights',
    label: '06',
    title: 'Your Privacy Rights',
    groups: [
      {
        heading: 'Access and control',
        intro:
          'You may access, review, update, or delete your personal information. You can manage connected accounts and revoke access at any time through your account settings.',
      },
      {
        heading: 'Revoke access',
        intro:
          'You can disconnect any integrated social account from Chronex at any time. Revoking access may prevent us from continuing the related integration.',
      },
      {
        heading: 'Opt out',
        intro:
          'You can opt out of promotional communications by following unsubscribe instructions in our emails or updating your notification preferences.',
      },
    ],
  },
  {
    id: 'cookies',
    label: '07',
    title: 'Cookies and Tracking Technologies',
    intro: 'We use cookies and similar technologies to enhance your experience on the platform:',
    items: [
      'Session cookies to maintain your login session',
      'Preference cookies to remember settings and preferences',
      'Analytics cookies to help us understand how our services are used',
    ],
    body: [
      'You can control cookie preferences through your browser settings. Disabling cookies may affect some functionality of our services.',
    ],
  },
  {
    id: 'oauth-permissions',
    label: '08',
    title: 'OAuth Permissions',
    body: [
      'When you authorize Chronex to access your social media accounts, you grant us specific permissions. You can review and modify these permissions through your account settings or the privacy controls of the respective platform.',
      'We only request the minimum permissions necessary to provide our services. We will never request permission to post on your behalf without explicit user action.',
    ],
  },
  {
    id: 'childrens-privacy',
    label: '09',
    title: "Children's Privacy",
    body: [
      'Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.',
      "If we learn that we have collected personal information from a child under 13, we will promptly delete that information and terminate the child's account. If you believe this has occurred, please contact us immediately.",
    ],
  },
  {
    id: 'data-retention',
    label: '10',
    title: 'Data Retention',
    body: [
      'We retain your personal information for as long as your account is active or as necessary to provide our services. You can request deletion of your data at any time through your account settings.',
      'We may retain certain information for legal compliance, fraud prevention, and security purposes even after a deletion request, and we will securely destroy information when it is no longer needed.',
    ],
  },
  {
    id: 'international-transfers',
    label: '11',
    title: 'International Data Transfers',
    body: [
      'If you are located outside the United States, your information may be transferred to, stored in, and processed in countries other than your country of residence. Those countries may have data protection laws that differ from your home country.',
      'By using our services, you consent to these transfers and the processing of your information in accordance with this Privacy Policy.',
    ],
  },
  {
    id: 'changes',
    label: '12',
    title: 'Changes to This Privacy Policy',
    body: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, and other factors. We will post the updated version on our website and revise the "Last updated" date at the top of this page.',
      'Your continued use of our services after such modifications constitutes your acceptance of the updated Privacy Policy.',
    ],
  },
  {
    id: 'contact',
    label: '13',
    title: 'Contact Us',
    body: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us using the details below.',
    ],
  },
  {
    id: 'acknowledgment',
    label: '14',
    title: 'Your Acknowledgment',
    body: [
      'By using Chronex, you acknowledge that you have read and understood this Privacy Policy and agree to its terms. If you do not agree with our privacy practices, please do not use our services.',
    ],
  },
]

export default function PrivacyPolicy() {
  const url = getBaseUrl()
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_85%_15%,hsl(var(--foreground)/0.06),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.42)_45%,hsl(var(--background)))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:36px_36px] opacity-[0.035]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40 mb-10 rounded-full border border-border/70 bg-background/80 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>

            <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-foreground/45 uppercase">
              <span>Privacy</span>
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span>Chronex</span>
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-2xl shadow-black/5 backdrop-blur-xl">
              <div className="border-b border-border/70 px-6 py-5 sm:px-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                    <LockKeyhole className="size-3.5" />
                    Privacy policy
                  </span>
                  <span className="text-xs tracking-[0.18em] text-foreground/45 uppercase">
                    Last updated: February 13, 2026
                  </span>
                </div>

                <div className="max-w-3xl">
                  <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] leading-[0.92] tracking-[-0.05em] text-card-foreground">
                    Clear terms,
                    <br />
                    careful data
                    <br />
                    handling.
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    This page explains what information Chronex collects, why it is needed, how it
                    is protected, and what control you have over it. The goal is simple: make the
                    policy readable without watering down the important details.
                  </p>
                </div>
              </div>

              <div className="grid gap-px bg-border/60 sm:grid-cols-3">
                {summaryCards.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="bg-card/90 px-6 py-6">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h2 className="text-base font-semibold tracking-[-0.03em] text-card-foreground">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              {policySections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="rounded-[1.75rem] border border-border/70 bg-card/75 px-6 py-6 shadow-lg shadow-black/5 backdrop-blur-sm sm:px-8 sm:py-8"
                >
                  <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-2 text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
                        Section {section.label}
                      </div>
                      <h2 className="font-serif text-3xl tracking-[-0.04em] text-card-foreground sm:text-4xl">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-5 text-[15px] leading-7 text-muted-foreground">
                    {section.intro ? <p>{section.intro}</p> : null}

                    {section.body?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}

                    {section.items ? (
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="rounded-2xl border border-border/60 bg-background/65 px-4 py-3 text-sm leading-6 text-foreground/75"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {section.groups?.map((group) => (
                      <div
                        key={group.heading}
                        className="rounded-[1.5rem] border border-border/60 bg-background/60 p-5"
                      >
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-card-foreground">
                          {group.heading}
                        </h3>
                        {group.intro ? <p className="mt-2">{group.intro}</p> : null}
                        {group.items ? (
                          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                            {group.items.map((item) => (
                              <li
                                key={item}
                                className="rounded-xl border border-border/55 bg-card px-4 py-3 text-sm leading-6 text-foreground/75"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}

                    {section.id === 'contact' ? (
                      <div className="grid gap-4 pt-2 md:grid-cols-3">
                        <div className="rounded-[1.5rem] border border-border/60 bg-background/65 p-5">
                          <Mail className="mb-4 size-5 text-primary" />
                          <div className="text-xs tracking-[0.16em] text-foreground/45 uppercase">
                            Email
                          </div>
                          <a
                            href="mailto:privacy@chronex.app"
                            className="mt-2 block text-sm font-medium text-card-foreground hover:text-primary"
                          >
                            privacy@chronex.app
                          </a>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/60 bg-background/65 p-5">
                          <Globe className="mb-4 size-5 text-primary" />
                          <div className="text-xs tracking-[0.16em] text-foreground/45 uppercase">
                            Website
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-card-foreground hover:text-primary"
                          >
                            {url}
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/60 bg-background/65 p-5">
                          <ShieldCheck className="mb-4 size-5 text-primary" />
                          <div className="text-xs tracking-[0.16em] text-foreground/45 uppercase">
                            Response time
                          </div>
                          <p className="mt-2 text-sm font-medium text-card-foreground">
                            We aim to respond within 30 days.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-primary/20 bg-primary/10 px-6 py-5 text-sm leading-6 text-foreground/75 shadow-lg shadow-black/5 sm:px-8">
              <p>
                <strong className="text-foreground">Disclaimer:</strong> This privacy policy is
                provided for informational purposes. Please consult a legal professional to confirm
                compliance with the laws and regulations that apply to your jurisdiction.
              </p>
            </div>
          </div>

          <aside className="h-fit lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/75 shadow-xl shadow-black/5 backdrop-blur-xl">
              <div className="border-b border-border/70 px-6 py-5">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
                  On this page
                </p>
                <h2 className="mt-2 font-serif text-2xl tracking-[-0.04em] text-card-foreground">
                  Quick navigation
                </h2>
              </div>

              <nav className="space-y-1 px-3 py-3">
                {policySections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-foreground/70 transition-colors hover:bg-background/80 hover:text-foreground"
                  >
                    <span>{section.title}</span>
                    <span className="font-mono text-[11px] text-foreground/40">
                      {section.label}
                    </span>
                  </a>
                ))}
              </nav>

              <div className="border-t border-border/70 px-6 py-5">
                <p className="text-xs tracking-[0.16em] text-foreground/45 uppercase">
                  Policy scope
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This policy covers website usage, account activity, connected platforms, cookies,
                  and communication with Chronex.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

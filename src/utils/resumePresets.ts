import { ResumeData } from '../types';

export const RESUME_PRESETS: Record<string, ResumeData> = {
  marketing: {
    fullName: 'Alex Morgan',
    jobTitle: 'Senior Digital Marketing Specialist',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    website: 'linkedin.com/in/alexmorgan',
    summary:
      'Data-driven digital marketing strategist with 5+ years of experience scaling acquisition pipelines, managing multi-channel ad budgets ($200k+), and accelerating organic traffic through SEO and content marketing.',
    experiences: [
      {
        id: 'exp_1',
        role: 'Growth Marketing Lead',
        company: 'Apex Media Group',
        duration: '2023 - Present',
        description:
          'Spearheaded performance marketing campaigns that grew qualified inbound leads by 142% year-over-year while cutting Customer Acquisition Cost (CAC) by 28%. Managed monthly Google Ads & Meta ad spend exceeding $85,000.',
      },
      {
        id: 'exp_2',
        role: 'Digital Strategist & SEO Manager',
        company: 'Vanguard Media',
        duration: '2021 - 2023',
        description:
          'Executed technical SEO audits and high-converting landing page A/B tests, generating over 1.2M organic monthly pageviews and driving a 34% increase in e-commerce conversions.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        degree: 'B.S. in Marketing & Communications',
        school: 'University of Washington',
        year: '2017 - 2021',
      },
    ],
    skills: [
      'Search Engine Optimization (SEO)',
      'Google Ads & Analytics 4',
      'Meta Ad Manager',
      'Email Automations (Klaviyo)',
      'HubSpot CRM',
      'Conversion Rate Optimization',
      'A/B Testing & Funnels',
      'Copywriting',
    ],
  },
  engineer: {
    fullName: 'David Chen',
    jobTitle: 'Full-Stack Software Engineer',
    email: 'david.chen@email.com',
    phone: '+1 (555) 987-6543',
    location: 'San Francisco, CA',
    website: 'github.com/davidchen-dev',
    summary:
      'Product-focused software engineer with 4+ years of expertise architecting high-concurrency web applications, microservices, and reactive frontend experiences using TypeScript, React, and Node.js.',
    experiences: [
      {
        id: 'exp_1',
        role: 'Senior Frontend Engineer',
        company: 'CloudScale Technologies',
        duration: '2022 - Present',
        description:
          'Architected real-time analytics dashboard servicing 120k daily active users. Reduced core bundle size by 42% and accelerated Largest Contentful Paint (LCP) from 3.4s to 0.9s.',
      },
      {
        id: 'exp_2',
        role: 'Software Developer',
        company: 'NextGen Systems',
        duration: '2020 - 2022',
        description:
          'Developed microservices and REST/GraphQL APIs handling 4,000 requests/second with 99.98% uptime. Automated CI/CD pipelines reducing deployment friction by 60%.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        degree: 'B.S. in Computer Science',
        school: 'University of California, Berkeley',
        year: '2016 - 2020',
      },
    ],
    skills: [
      'TypeScript & JavaScript (ES6+)',
      'React & Next.js',
      'Node.js & Express',
      'PostgreSQL & MongoDB',
      'Docker & Kubernetes',
      'AWS (Lambda, S3, ECS)',
      'Tailwind CSS',
      'Git & CI/CD Pipelines',
    ],
  },
  sales: {
    fullName: 'Sarah Jenkins',
    jobTitle: 'Enterprise Account Executive',
    email: 'sarah.jenkins@email.com',
    phone: '+1 (555) 345-6789',
    location: 'Chicago, IL',
    website: 'linkedin.com/in/sarahjenkins',
    summary:
      'Top-performing B2B SaaS Account Executive with a track record of consistently exceeding annual quotas (135% average quota attainment). Proven skill in consultative discovery, multi-stakeholder negotiations, and contract closings.',
    experiences: [
      {
        id: 'exp_1',
        role: 'Senior Enterprise AE',
        company: 'SaaSify Solutions',
        duration: '2022 - Present',
        description:
          'Closed $2.4M in Annual Recurring Revenue (ARR) across Fortune 500 accounts, maintaining a 42% sales cycle win rate. Awarded President’s Club honors for top regional performance.',
      },
      {
        id: 'exp_2',
        role: 'Mid-Market Account Executive',
        company: 'Elevate Software',
        duration: '2019 - 2022',
        description:
          'Managed full sales cycle from initial qualification to technical demos and commercial terms. Sourced 35% of closed pipeline through strategic cold outbound.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        degree: 'B.A. in Business Administration',
        school: 'Indiana University - Kelley School of Business',
        year: '2015 - 2019',
      },
    ],
    skills: [
      'B2B Enterprise SaaS Sales',
      'Pipeline Forecasting',
      'Consultative Discovery',
      'Contract Negotiations',
      'Salesforce & Outreach.io',
      'Executive Stakeholder Demos',
      'Customer Retention & Expansion',
    ],
  },
  fresher: {
    fullName: 'Emily Taylor',
    jobTitle: 'Recent Graduate / Junior Analyst',
    email: 'emily.taylor@email.com',
    phone: '+1 (555) 789-0123',
    location: 'Austin, TX',
    website: 'linkedin.com/in/emilytaylor',
    summary:
      'Motivated honors graduate in Business Analytics with strong foundation in statistical modeling, Excel data manipulation, and cross-functional project execution. Seeking an entry-level analyst or operations role.',
    experiences: [
      {
        id: 'exp_1',
        role: 'Operations & Research Intern',
        company: 'Apex Logistics',
        duration: 'Summer 2024',
        description:
          'Constructed automated Excel dashboards tracking regional delivery bottlenecks, improving route efficiency by 14%. Synthesized survey data from 400+ clients into executive summaries.',
      },
      {
        id: 'exp_2',
        role: 'Student Project Lead',
        company: 'University Capstone Program',
        duration: '2023 - 2024',
        description:
          'Led team of 5 in conducting demographic market research for a local retail partner, delivering actionable growth recommendations that boosted seasonal customer retention by 18%.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        degree: 'B.S. in Business Administration (Cum Laude)',
        school: 'University of Texas at Austin',
        year: '2020 - 2024',
      },
    ],
    skills: [
      'Microsoft Excel (VLOOKUP, Pivot)',
      'Data Analysis & Reporting',
      'Problem Solving',
      'Cross-Functional Teamwork',
      'Project Planning',
      'Presentation & Public Speaking',
      'SQL Fundamentals',
    ],
  },
};

// =====================================================================
//  SIMULATED AI RESPONSE — Realistic GDPR Data Privacy Policy Analysis
// =====================================================================
const SIMULATED_RESPONSE = {
    document: {
        title: "GDPR Data Privacy & Protection Policy 2026",
        type: "Regulatory Compliance",
        pages: 42,
        analyzedAt: new Date().toISOString(),
        riskLevel: "High",
        complianceScore: 32
    },
    summary: "Analysis of the GDPR Data Privacy & Protection Policy revealed 18 actionable obligations across 5 departments. Critical items include implementing data encryption, conducting DPIAs, and establishing a 72-hour breach notification procedure.",
    departments: [
        {
            name: "Information Technology",
            icon: "🖥️",
            color: "#6366f1",
            tasks: [
                {
                    id: "IT-001",
                    title: "Implement end-to-end data encryption",
                    description: "Deploy AES-256 encryption for all personal data at rest and TLS 1.3 for data in transit across all production systems.",
                    priority: "critical",
                    dueDate: "2026-07-15",
                    sourceClause: "Article 32 — Security of Processing",
                    completed: false
                },
                {
                    id: "IT-002",
                    title: "Deploy automated access control system",
                    description: "Implement role-based access control (RBAC) with multi-factor authentication for all systems processing personal data.",
                    priority: "high",
                    dueDate: "2026-07-30",
                    sourceClause: "Article 25 — Data Protection by Design",
                    completed: false
                },
                {
                    id: "IT-003",
                    title: "Configure 72-hour breach detection & alerting",
                    description: "Set up SIEM rules, automated incident detection, and notification pipeline to meet the 72-hour breach reporting requirement.",
                    priority: "critical",
                    dueDate: "2026-07-10",
                    sourceClause: "Article 33 — Notification of a Personal Data Breach",
                    completed: false
                },
                {
                    id: "IT-004",
                    title: "Build data subject access request (DSAR) portal",
                    description: "Create a self-service portal allowing data subjects to submit access, rectification, and deletion requests with automated routing.",
                    priority: "medium",
                    dueDate: "2026-08-30",
                    sourceClause: "Articles 15-20 — Rights of the Data Subject",
                    completed: false
                }
            ]
        },
        {
            name: "Human Resources",
            icon: "👥",
            color: "#f59e0b",
            tasks: [
                {
                    id: "HR-001",
                    title: "Conduct mandatory GDPR training for all staff",
                    description: "Roll out organization-wide data protection training covering lawful processing bases, data subject rights, and breach reporting procedures.",
                    priority: "high",
                    dueDate: "2026-08-15",
                    sourceClause: "Article 39(1)(b) — Tasks of the DPO",
                    completed: false
                },
                {
                    id: "HR-002",
                    title: "Update employee privacy notices",
                    description: "Revise all employee-facing privacy notices to include transparent information about data processing purposes, retention periods, and individual rights.",
                    priority: "medium",
                    dueDate: "2026-08-30",
                    sourceClause: "Articles 13-14 — Information to be Provided",
                    completed: false
                },
                {
                    id: "HR-003",
                    title: "Implement data processing agreements with staffing vendors",
                    description: "Ensure all third-party staffing agencies and HR SaaS providers have signed GDPR-compliant data processing agreements.",
                    priority: "high",
                    dueDate: "2026-07-30",
                    sourceClause: "Article 28 — Processor",
                    completed: false
                }
            ]
        },
        {
            name: "Legal & Compliance",
            icon: "⚖️",
            color: "#a78bfa",
            tasks: [
                {
                    id: "LEG-001",
                    title: "Appoint a Data Protection Officer (DPO)",
                    description: "Formally designate a qualified DPO and register with the relevant supervisory authority. Ensure independence and adequate resourcing.",
                    priority: "critical",
                    dueDate: "2026-07-01",
                    sourceClause: "Articles 37-39 — Data Protection Officer",
                    completed: false
                },
                {
                    id: "LEG-002",
                    title: "Conduct Data Protection Impact Assessments (DPIA)",
                    description: "Perform DPIAs for all high-risk processing activities including AI-driven profiling, large-scale biometric data processing, and cross-border transfers.",
                    priority: "critical",
                    dueDate: "2026-07-20",
                    sourceClause: "Article 35 — Data Protection Impact Assessment",
                    completed: false
                },
                {
                    id: "LEG-003",
                    title: "Review and update consent mechanisms",
                    description: "Audit all consent collection points to ensure they meet the granular, freely-given, and withdrawable consent standard.",
                    priority: "high",
                    dueDate: "2026-08-10",
                    sourceClause: "Article 7 — Conditions for Consent",
                    completed: false
                },
                {
                    id: "LEG-004",
                    title: "Establish cross-border data transfer safeguards",
                    description: "Implement Standard Contractual Clauses (SCCs) or Binding Corporate Rules for all international data transfers outside the EEA.",
                    priority: "high",
                    dueDate: "2026-08-30",
                    sourceClause: "Articles 44-49 — Transfers of Personal Data to Third Countries",
                    completed: false
                }
            ]
        },
        {
            name: "Finance & Audit",
            icon: "📊",
            color: "#10b981",
            tasks: [
                {
                    id: "FIN-001",
                    title: "Allocate GDPR compliance implementation budget",
                    description: "Secure and allocate budget for privacy tooling, staff training, DPO hiring, and third-party audit engagements.",
                    priority: "high",
                    dueDate: "2026-07-15",
                    sourceClause: "Recital 77 — Resources & Implementation",
                    completed: false
                },
                {
                    id: "FIN-002",
                    title: "Schedule external compliance audit",
                    description: "Engage an independent auditor to perform a pre-enforcement readiness assessment against GDPR Articles 5, 24, and 32.",
                    priority: "medium",
                    dueDate: "2026-09-15",
                    sourceClause: "Article 5(2) — Accountability Principle",
                    completed: false
                },
                {
                    id: "FIN-003",
                    title: "Establish fine risk reserve fund",
                    description: "Assess maximum penalty exposure (up to €20M or 4% of global turnover) and establish appropriate financial reserves.",
                    priority: "low",
                    dueDate: "2026-09-30",
                    sourceClause: "Article 83 — Administrative Fines",
                    completed: false
                }
            ]
        },
        {
            name: "Operations",
            icon: "⚙️",
            color: "#f97316",
            tasks: [
                {
                    id: "OPS-001",
                    title: "Create Records of Processing Activities (ROPA)",
                    description: "Document all personal data processing activities including purposes, categories of data subjects, recipients, retention periods, and security measures.",
                    priority: "critical",
                    dueDate: "2026-07-20",
                    sourceClause: "Article 30 — Records of Processing Activities",
                    completed: false
                },
                {
                    id: "OPS-002",
                    title: "Implement data retention & deletion procedures",
                    description: "Define retention schedules for each data category and implement automated deletion workflows for data past its retention period.",
                    priority: "high",
                    dueDate: "2026-08-15",
                    sourceClause: "Article 5(1)(e) — Storage Limitation",
                    completed: false
                },
                {
                    id: "OPS-003",
                    title: "Develop incident response playbook",
                    description: "Create a step-by-step breach response playbook covering detection, containment, notification, and post-incident review procedures.",
                    priority: "high",
                    dueDate: "2026-07-30",
                    sourceClause: "Articles 33-34 — Breach Notification",
                    completed: false
                },
                {
                    id: "OPS-004",
                    title: "Map all third-party data processors",
                    description: "Create a comprehensive register of all vendors and sub-processors with access to personal data, including data flow diagrams.",
                    priority: "medium",
                    dueDate: "2026-08-30",
                    sourceClause: "Article 28 — Processor",
                    completed: false
                }
            ]
        }
    ]
};

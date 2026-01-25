# Cahier des charges
## Projet de mise en place d’un ERP (type SAP)

---

## 1. Contexte et objectifs

### 1.1 Contexte général
L’entreprise souhaite mettre en place un ERP intégré, inspiré des solutions de type SAP, afin de centraliser, sécuriser et automatiser l’ensemble de ses processus métiers. L’objectif est de remplacer des outils dispersés (Excel, applications isolées, outils internes) par une plateforme unique, cohérente et évolutive.

### 1.2 Objectifs principaux
- Centraliser les données métiers dans un système unique
- Améliorer la fiabilité et la traçabilité des données
- Automatiser les processus clés
- Réduire les tâches manuelles et les risques d’erreur
- Disposer d’indicateurs fiables pour la prise de décision
- Assurer la conformité réglementaire et la sécurité des données

---

## 2. Périmètre du projet

### 2.1 Périmètre fonctionnel
L’ERP devra couvrir, à terme, les modules suivants :
- Gestion financière et comptable (multi-sociétés, multi-devises, consolidation IFRS, interco)
- Achats et fournisseurs (SRM, sourcing, contrats, portail fournisseurs)
- Ventes et clients (order-to-cash, abonnements, omnicanal)
- Gestion des stocks et Supply Chain (MRP, prévisions, logistique)
- Production / opérations (ordonnancement, qualité, maintenance)
- Ressources humaines (Core HR, talent, paie si internalisée ultérieurement)
- Gestion de projets (portefeuille, coûts, revenus)
- Service client / support après-vente (ticketing, SLA, knowledge base)
- Reporting, BI, planification financière (FP&A) et analytics avancés
- Administration, sécurité et gouvernance des données
- Cadre low-code / extensibilité (workflows, formulaires, RPA)

### 2.2 Hors périmètre (phase initiale)
- Paie externalisée (si applicable)
- CRM marketing automation avancé
- Modules spécifiques métier non standards (à définir ultérieurement)
- Optimisation IA avancée (prévision, maintenance prédictive) en phase 2

### 2.3 Hypothèses et dépendances
- Référentiels métiers consolidés avant la phase de conception
- Engagement des directions métiers pour ateliers Fit-to-Standard / Gap Analysis
- Environnements techniques (DEV/INT/QA/PRD) disponibles et sécurisés
- Interfaces critiques recensées et contraintes réglementaires clarifiées

---

## 3. Utilisateurs et profils

### 3.1 Types d’utilisateurs
- Administrateurs système / Basis
- Direction / Comité exécutif
- Finance / Comptabilité / Contrôle de gestion
- RH / Talent / Paie
- Achats / Approvisionnements
- Opérations / Production / Maintenance
- Ventes / Service client / Centres d’appel
- Utilisateurs standards et occasionnels (portail self-service)
- Partenaires externes (portail fournisseurs / clients)

### 3.2 Gestion des droits
- Gestion fine des rôles, profils métiers et restrictions SoD (Segregation of Duties)
- Accès par module et par niveau (lecture, écriture, validation) avec workflows d’approbation
- Traçabilité horodatée des actions utilisateurs (logs, audit trail)
- Revues périodiques des accès et recertification automatisée
- Intégration IAM / SSO (Azure AD, Keycloak, autres) et MFA

---

## 4. Exigences fonctionnelles

### 4.1 Module Finance & Comptabilité
- Comptabilité générale et analytique, multi-plans et multi-sociétés
- Gestion des écritures (automatisation, rapprochement bancaire, lettrage)
- Budgets, forecasts, scénarios, contrôles d’engagement
- Facturation clients, e-invoicing (Factur-X, Peppol), recouvrement
- Paiements, relances, gestion du credit management
- Gestion multi-devises, interco, consolidation IFRS, immobilisations, IFRS 16
- Exports / imports comptables normalisés, API experts-comptables

### 4.2 Module Achats & Fournisseurs
- Référentiel fournisseurs (qualification, scoring, documents légaux)
- Demandes d’achat, sourcing, catalogues, bons de commande
- Réception, contrôles qualité, litiges, gestion des contrats
- Factures fournisseurs, 3-way match, conformité TVA
- Workflows paramétrables, seuils et règles de délégation
- Portail fournisseur (commandes, factures, statut paiement)

### 4.3 Module Ventes & Clients
- Référentiel clients, hiérarchies, accords commerciaux
- Devis, commandes, contrats, abonnements, CPQ
- Pricing avancé (remises, promotions, multi-devise)
- Livraison, facturation, avoirs, crédit client
- Suivi chiffre d’affaires, marge, pipeline, backlog
- Portail client (commandes, SAV, factures, tickets)

### 4.4 Module Stocks & Supply Chain
- Multi-entrepôts, multi-sites, unités multiples, gestion 3PL
- Entrées/sorties, transferts, cross-docking, consignment
- Inventaires tournants, cycle counts, traçabilité lot / série
- Alertes seuils, réapprovisionnement automatique, MRP, ATP/CTP
- Prévisions de demande, plan directeur de production (S&OP)

### 4.5 Module Production & Qualité
- Gestion des nomenclatures (BOM) et gammes opératoires
- Ordonnancement, suivi atelier (MES léger), indicateurs OEE
- Contrôles qualité, non-conformités, plans d’action (CAPA)
- Maintenance préventive et corrective (GMAO), spare parts

### 4.6 Module Ressources Humaines
- Dossiers employés, organigrammes, workflow d’approbation
- Congés, absences, temps de travail, notes de frais
- Recrutement, onboarding, évaluations, développement des compétences
- Portail self-service employés/managers, mobile

### 4.7 Module Gestion de projets
- Portefeuille projets CAPEX/OPEX, hiérarchies, dépendances
- Affectation ressources, plan de charge, compétences
- Suivi coûts/délais/revenus, Earned Value Management, facturation à l’avancement
- Timesheets, intégration Finance (WBS, centres de coûts)

### 4.8 Reporting, BI & planification
- Tableaux de bord personnalisables, KPIs temps réel
- Reporting réglementaire, audit trail, storytelling
- Self-service BI (Power BI, SAP Analytics Cloud, etc.), data warehouse
- Planification intégrée (S&OP, FP&A, Workforce planning)

### 4.9 Gouvernance des données et référentiels
- Master Data Management (clients, fournisseurs, produits, articles, employés)
- Workflows de création / modification, règles de qualité, dédoublonnage
- Historisation, traçabilité, politiques de retention

### 4.10 Processus transverses
- Workflows configurables (approbation, exception, escalade)
- Notifications omnicanales (email, Teams, mobile, SMS)
- Gestion documentaire (GED), pièces jointes contextualisées

---

## 5. Exigences techniques

### 5.1 Architecture
- Architecture web n-tiers (client léger, responsive) + app mobile
- Déploiement cloud, on-prem ou hybride, haute disponibilité ≥ 99,5 %
- Environnements DEV / INT / QA / PREPROD / PROD avec CI/CD automatisé
- Microservices ou modules découplés, APIs REST/GraphQL, événements (Kafka, Service Bus)
- Moteur workflow low-code, orchestrations RPA, connecteurs SAP standards
- Observabilité : monitoring, logs centralisés, alerting (APM)

### 5.2 Performance et scalabilité
- Temps de réponse < 2s pour 95 % des transactions courantes
- Traitement batch optimisé (MTO, MRP, clôtures) et planification nocturne
- Scalabilité horizontale/verticale, montée en charge planifiée (stress tests)

### 5.3 Sécurité
- Authentification forte (SSO, MFA), gestion des rôles et SoD
- Chiffrement des données sensibles (au repos et en transit)
- Sauvegardes automatisées, restauration testée, PRA/PCA documenté
- Gestion clés (KMS/HSM), secrets management

### 5.4 Conformité & audit
- RGPD / GDPR, SOX (si applicable), normes sectorielles
- Journalisation détaillée des accès, modifications, données critiques
- Retention des logs et preuves d’audit (WORM, immutabilité)

### 5.5 Qualité et tests
- Tests automatisés (unitaires, intégration, régression, performance)
- Stratégie de non-régression sur processus critiques (Finance, Supply)

### 5.6 Données et analytics
- Modèle de données documenté, meta-données, dictionnaire des données
- Intégration avec data lake / entrepôt, API temps réel

---

## 6. Interfaces et intégrations

- Catalogue d’API REST/GraphQL sécurisé (OAuth2)
- Connecteurs standards (comptabilité, banques, TMS, WMS, CRM, MES, HRIS)
- EDI (ORDERS, DESADV, INVOIC…), Peppol, Factur-X
- ESB / iPaaS / bus d’événements pour intégrations temps réel
- Import / export massif (CSV, Excel, sFTP) avec validations
- Webhooks et intégration outils collaboratifs (Teams, Slack)
- Stratégie de tests d’intégration et monitoring des flux

---

## 7. Ergonomie et UX

- Interface cohérente et personnalisable par rôle (Fiori-like, design system)
- Navigation guidée par processus, écrans responsives desktop/tablette/mobile
- Expérience multilingue (FR, EN, + extensions locales), gestion fuseaux horaires
- Accessibilité (WCAG 2.1 AA), thèmes clair/sombre
- Assistance contextuelle, tutoriels intégrés, recherche globale
- KPI et widgets personnalisables par utilisateur

---

## 8. Maintenance, support et évolutivité

- Documentation technique/fonctionnelle versionnée, knowledge base
- Stratégie DevSecOps, pipelines CI/CD, tests automatisés
- Processus de gestion des changements (CAB, release calendar)
- Mises à jour sans interruption majeure (blue/green, rolling upgrade)
- Support multi-niveaux (L1/L2/L3), SLA, ticketing, monitoring proactif
- Roadmap d’extensions (modules additionnels, IA, BI avancée)

---

## 9. Planning prévisionnel (macro)

- Phase 0 : Préparation projet (mobilisation équipes, gouvernance, cadrage)
- Phase 1 : Analyse détaillée / Fit-to-standard / Gap analysis
- Phase 2 : Conception fonctionnelle & technique (Blueprint)
- Phase 3 : Réalisations (configurations, développements, intégrations)
- Phase 4 : Tests (unitaires, intégrés, UAT, performance, sécurité)
- Phase 5 : Migration de données & coupure (mock runs, dress rehearsal)
- Phase 6 : Déploiement progressif (pilotage par lots/sites)
- Phase 7 : Formation, conduite du changement, hypercare
- Phase 8 : Passage en régime permanent et amélioration continue

---

## 10. Livrables attendus

- Cahier de cadrage et matrice de décision (build vs buy, cloud vs on-prem)
- Spécifications fonctionnelles détaillées / user stories / process maps (BPMN)
- Spécifications techniques, dossiers d’architecture, normes d’intégration
- Paramétrages, développements, jeux de tests, scripts migration
- Environnements configurés (DEV/INT/QA/PRD) et documentation d’exploitation
- Documentation utilisateur, administrateur, guides de support
- Plan de formation, supports pédagogiques, e-learning
- Rapport de tests, PV de recette, plan de continuité / PRA

---

## 11. Critères de succès et KPIs

- Adoption utilisateurs (>90 % processus cibles opérés dans l’ERP)
- Respect budget (±5 %) et planning (jalons validés)
- Performance système (95 % transactions <2s, disponibilité ≥99,5 %)
- Qualité des données (taux d’erreurs <1 %, référentiels validés)
- Conformité audit (zéro non-conformité majeure)
- Satisfaction métiers (NPS projet ≥ +30)

---

## 12. Budget et contraintes

- Budget global pluriannuel (licences, intégration, infrastructure, changement)
- Capex vs Opex, TCO sur 5 ans, ROI attendu
- Contraintes de délais (go-live pilot, go-live global, blackout périodes)
- Disponibilité des ressources internes (SME, key users, IT) et besoins renfort externes
- Alignement avec politiques achats, sécurité et conformité corporate

---

## 13. Gouvernance, conduite du changement et risques

- Comité de pilotage (sponsors, directions métiers, IT)
- PMO central, chef de projet métier + chef de projet IT
- Référents métiers (key users) par domaine, ambassadeurs du changement
- Prestataire / intégrateur (responsabilités, pénalités, SLA)
- Structure de décision (RACI, niveaux d’escalade, CAB)
- Plan de conduite du changement (communication, formation, support, adoption)
- Gestion des risques (registre, plan de mitigation, indicateurs santé projet)

---

## 14. Données, migration et qualité

- Stratégie de migration (ETL, outils, mapping, règles de nettoyage)
- Cycles de migration mock (dry run) et validation par métiers
- Gouvernance des données (Data Owners, Data Stewards, comités)

---

## 15. Formation et accompagnement

- Plan de formation par persona (Finance, Supply, RH, IT)
- Plateformes e-learning, sandbox pratiques, certification interne
- Support hypercare post go-live (30-90 jours), canaux de support

---

## 16. Gestion du changement organisationnel

- Analyse d’impact organisationnel, adaptation processus/roles
- Communication interne multicanal (newsletters, webinars, townhalls)
- KPIs adoption et plan d’amélioration continue

---

Fin du document
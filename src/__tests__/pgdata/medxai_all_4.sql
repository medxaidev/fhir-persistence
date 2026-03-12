-- MedXAI FHIR Schema DDL
-- Version: fhir-r4-v4.0.1
-- Generated: 2026-02-25T20:39:19.176Z
-- Resource types: 146
--
-- This file is auto-generated. Do not edit manually.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE OR REPLACE FUNCTION token_array_to_text(arr text[]) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT array_to_string(arr, ' ') $$;

CREATE TABLE IF NOT EXISTS "HumanName" (
  "resourceId" UUID NOT NULL,
  "name" TEXT,
  "given" TEXT,
  "family" TEXT
);

CREATE TABLE IF NOT EXISTS "Address" (
  "resourceId" UUID NOT NULL,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "postalCode" TEXT,
  "state" TEXT,
  "use" TEXT
);

CREATE TABLE IF NOT EXISTS "ContactPoint" (
  "resourceId" UUID NOT NULL,
  "system" TEXT,
  "value" TEXT,
  "use" TEXT
);

CREATE TABLE IF NOT EXISTS "Identifier" (
  "resourceId" UUID NOT NULL,
  "system" TEXT,
  "value" TEXT
);

CREATE TABLE IF NOT EXISTS "Account" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "owner" TEXT,
  "patient" TEXT[],
  "period" TIMESTAMPTZ,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT[],
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Account_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Account_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Account_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Account_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ActivityDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ActivityDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActivityDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ActivityDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ActivityDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ActivityDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "AdverseEvent" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__actuality" UUID[],
  "__actualityText" TEXT[],
  "__actualitySort" TEXT,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "date" TIMESTAMPTZ,
  "__event" UUID[],
  "__eventText" TEXT[],
  "__eventSort" TEXT,
  "location" TEXT,
  "recorder" TEXT,
  "resultingcondition" TEXT[],
  "__seriousness" UUID[],
  "__seriousnessText" TEXT[],
  "__seriousnessSort" TEXT,
  "__severity" UUID[],
  "__severityText" TEXT[],
  "__severitySort" TEXT,
  "study" TEXT[],
  "subject" TEXT,
  "substance" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "AdverseEvent_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdverseEvent_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "AdverseEvent_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "AdverseEvent_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "AdverseEvent_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "AllergyIntolerance" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "asserter" TEXT,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__clinicalStatus" UUID[],
  "__clinicalStatusText" TEXT[],
  "__clinicalStatusSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__criticality" UUID[],
  "__criticalityText" TEXT[],
  "__criticalitySort" TEXT,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "lastDate" TIMESTAMPTZ,
  "__manifestation" UUID[],
  "__manifestationText" TEXT[],
  "__manifestationSort" TEXT,
  "onset" TIMESTAMPTZ[],
  "patient" TEXT,
  "recorder" TEXT,
  "__route" UUID[],
  "__routeText" TEXT[],
  "__routeSort" TEXT,
  "__severity" UUID[],
  "__severityText" TEXT[],
  "__severitySort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__verificationStatus" UUID[],
  "__verificationStatusText" TEXT[],
  "__verificationStatusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "AllergyIntolerance_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AllergyIntolerance_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "AllergyIntolerance_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "AllergyIntolerance_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "AllergyIntolerance_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "actor" TEXT[],
  "__appointmentType" UUID[],
  "__appointmentTypeText" TEXT[],
  "__appointmentTypeSort" TEXT,
  "basedOn" TEXT[],
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT[],
  "__partStatus" UUID[],
  "__partStatusText" TEXT[],
  "__partStatusSort" TEXT,
  "patient" TEXT[],
  "practitioner" TEXT[],
  "__reasonCode" UUID[],
  "__reasonCodeText" TEXT[],
  "__reasonCodeSort" TEXT,
  "reasonReference" TEXT[],
  "__serviceCategory" UUID[],
  "__serviceCategoryText" TEXT[],
  "__serviceCategorySort" TEXT,
  "__serviceType" UUID[],
  "__serviceTypeText" TEXT[],
  "__serviceTypeSort" TEXT,
  "slot" TEXT[],
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "supportingInfo" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Appointment_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Appointment_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Appointment_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Appointment_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Appointment_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "AppointmentResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "actor" TEXT,
  "appointment" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT,
  "__partStatus" UUID[],
  "__partStatusText" TEXT[],
  "__partStatusSort" TEXT,
  "patient" TEXT,
  "practitioner" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "AppointmentResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AppointmentResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "AppointmentResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "AppointmentResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "AppointmentResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__action" UUID[],
  "__actionText" TEXT[],
  "__actionSort" TEXT,
  "__addressSort" TEXT,
  "agent" TEXT[],
  "agentName" TEXT[],
  "__agentRole" UUID[],
  "__agentRoleText" TEXT[],
  "__agentRoleSort" TEXT,
  "__altid" UUID[],
  "__altidText" TEXT[],
  "__altidSort" TEXT,
  "date" TIMESTAMPTZ,
  "entity" TEXT[],
  "entityName" TEXT[],
  "__entityRole" UUID[],
  "__entityRoleText" TEXT[],
  "__entityRoleSort" TEXT,
  "__entityType" UUID[],
  "__entityTypeText" TEXT[],
  "__entityTypeSort" TEXT,
  "__outcome" UUID[],
  "__outcomeText" TEXT[],
  "__outcomeSort" TEXT,
  "patient" TEXT[],
  "policy" TEXT[],
  "__site" UUID[],
  "__siteText" TEXT[],
  "__siteSort" TEXT,
  "source" TEXT,
  "__subtype" UUID[],
  "__subtypeText" TEXT[],
  "__subtypeSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "AuditEvent_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditEvent_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "AuditEvent_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "AuditEvent_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "AuditEvent_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Basic" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "created" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Basic_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Basic_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Basic_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Basic_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Basic_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Binary" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Binary_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Binary_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Binary_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Binary_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Binary_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "BiologicallyDerivedProduct" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "BiologicallyDerivedProduct_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BiologicallyDerivedProduct_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "BiologicallyDerivedProduct_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "BiologicallyDerivedProduct_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "BiologicallyDerivedProduct_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "BodyStructure" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__location" UUID[],
  "__locationText" TEXT[],
  "__locationSort" TEXT,
  "__morphology" UUID[],
  "__morphologyText" TEXT[],
  "__morphologySort" TEXT,
  "patient" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "BodyStructure_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BodyStructure_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "BodyStructure_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "BodyStructure_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "BodyStructure_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Bundle" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composition" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "message" TEXT,
  "timestamp" TIMESTAMPTZ,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Bundle_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Bundle_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Bundle_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Bundle_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Bundle_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CapabilityStatement" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__fhirversion" UUID[],
  "__fhirversionText" TEXT[],
  "__fhirversionSort" TEXT,
  "__format" UUID[],
  "__formatText" TEXT[],
  "__formatSort" TEXT,
  "guide" TEXT[],
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__mode" UUID[],
  "__modeText" TEXT[],
  "__modeSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__resource" UUID[],
  "__resourceText" TEXT[],
  "__resourceSort" TEXT,
  "resourceProfile" TEXT[],
  "__securityService" UUID[],
  "__securityServiceText" TEXT[],
  "__securityServiceSort" TEXT,
  "software" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "supportedProfile" TEXT[],
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CapabilityStatement_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CapabilityStatement_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CapabilityStatement_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CapabilityStatement_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CapabilityStatement_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CarePlan" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__activityCode" UUID[],
  "__activityCodeText" TEXT[],
  "__activityCodeSort" TEXT,
  "activityDate" TIMESTAMPTZ[],
  "activityReference" TEXT[],
  "basedOn" TEXT[],
  "careTeam" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "condition" TEXT[],
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "goal" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "performer" TEXT[],
  "replaces" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CarePlan_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CarePlan_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CarePlan_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CarePlan_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CarePlan_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CareTeam" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "participant" TEXT[],
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CareTeam_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CareTeam_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CareTeam_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CareTeam_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CareTeam_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CatalogEntry" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CatalogEntry_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CatalogEntry_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CatalogEntry_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CatalogEntry_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CatalogEntry_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ChargeItem" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "account" TEXT[],
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "context" TEXT,
  "enteredDate" TIMESTAMPTZ,
  "enterer" TEXT,
  "factorOverride" DOUBLE PRECISION,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "occurrence" TIMESTAMPTZ,
  "patient" TEXT,
  "performerActor" TEXT[],
  "__performerFunction" UUID[],
  "__performerFunctionText" TEXT[],
  "__performerFunctionSort" TEXT,
  "performingOrganization" TEXT,
  "priceOverride" DOUBLE PRECISION,
  "quantity" DOUBLE PRECISION,
  "requestingOrganization" TEXT,
  "service" TEXT[],
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ChargeItem_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChargeItem_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ChargeItem_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ChargeItem_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ChargeItem_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ChargeItemDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ChargeItemDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChargeItemDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ChargeItemDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ChargeItemDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ChargeItemDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Claim" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "careTeam" TEXT[],
  "created" TIMESTAMPTZ,
  "detailUdi" TEXT[],
  "encounter" TEXT[],
  "enterer" TEXT,
  "facility" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "insurer" TEXT,
  "itemUdi" TEXT[],
  "patient" TEXT,
  "payee" TEXT,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "procedureUdi" TEXT[],
  "provider" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subdetailUdi" TEXT[],
  "__use" UUID[],
  "__useText" TEXT[],
  "__useSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Claim_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Claim_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Claim_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Claim_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Claim_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ClaimResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "created" TIMESTAMPTZ,
  "disposition" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "insurer" TEXT,
  "__outcome" UUID[],
  "__outcomeText" TEXT[],
  "__outcomeSort" TEXT,
  "patient" TEXT,
  "paymentDate" TIMESTAMPTZ,
  "request" TEXT,
  "requestor" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__use" UUID[],
  "__useText" TEXT[],
  "__useSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ClaimResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClaimResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ClaimResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ClaimResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ClaimResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ClinicalImpression" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "assessor" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__findingCode" UUID[],
  "__findingCodeText" TEXT[],
  "__findingCodeSort" TEXT,
  "findingRef" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "investigation" TEXT[],
  "patient" TEXT,
  "previous" TEXT,
  "problem" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "supportingInfo" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ClinicalImpression_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ClinicalImpression_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ClinicalImpression_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ClinicalImpression_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ClinicalImpression_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CodeSystem" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__contentMode" UUID[],
  "__contentModeText" TEXT[],
  "__contentModeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__language" UUID[],
  "__languageText" TEXT[],
  "__languageSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "supplements" TEXT,
  "system" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CodeSystem_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CodeSystem_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CodeSystem_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CodeSystem_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CodeSystem_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Communication" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedOn" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "__medium" UUID[],
  "__mediumText" TEXT[],
  "__mediumSort" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "received" TIMESTAMPTZ,
  "recipient" TEXT[],
  "sender" TEXT,
  "sent" TIMESTAMPTZ,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Communication_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Communication_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Communication_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Communication_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Communication_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CommunicationRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authored" TIMESTAMPTZ,
  "basedOn" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "encounter" TEXT,
  "__groupIdentifier" UUID[],
  "__groupIdentifierText" TEXT[],
  "__groupIdentifierSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__medium" UUID[],
  "__mediumText" TEXT[],
  "__mediumSort" TEXT,
  "occurrence" TIMESTAMPTZ,
  "patient" TEXT,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "recipient" TEXT[],
  "replaces" TEXT[],
  "requester" TEXT,
  "sender" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CommunicationRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CommunicationRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CommunicationRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CommunicationRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CompartmentDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__resource" UUID[],
  "__resourceText" TEXT[],
  "__resourceSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CompartmentDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompartmentDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CompartmentDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CompartmentDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CompartmentDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Composition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "attester" TEXT[],
  "author" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__confidentiality" UUID[],
  "__confidentialityText" TEXT[],
  "__confidentialitySort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "entry" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "period" TIMESTAMPTZ[],
  "__relatedId" UUID[],
  "__relatedIdText" TEXT[],
  "__relatedIdSort" TEXT,
  "relatedRef" TEXT[],
  "__section" UUID[],
  "__sectionText" TEXT[],
  "__sectionSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "title" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Composition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Composition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Composition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Composition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Composition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ConceptMap" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependson" TEXT[],
  "description" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "other" TEXT[],
  "product" TEXT[],
  "publisher" TEXT,
  "source" TEXT,
  "__sourceCode" UUID[],
  "__sourceCodeText" TEXT[],
  "__sourceCodeSort" TEXT,
  "sourceSystem" TEXT[],
  "sourceUri" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "target" TEXT,
  "__targetCode" UUID[],
  "__targetCodeText" TEXT[],
  "__targetCodeSort" TEXT,
  "targetSystem" TEXT[],
  "targetUri" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ConceptMap_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ConceptMap_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ConceptMap_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ConceptMap_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ConceptMap_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Condition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "abatementAge" DOUBLE PRECISION,
  "abatementDate" TIMESTAMPTZ,
  "abatementString" TEXT,
  "asserter" TEXT,
  "__bodySite" UUID[],
  "__bodySiteText" TEXT[],
  "__bodySiteSort" TEXT,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__clinicalStatus" UUID[],
  "__clinicalStatusText" TEXT[],
  "__clinicalStatusSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "encounter" TEXT,
  "__evidence" UUID[],
  "__evidenceText" TEXT[],
  "__evidenceSort" TEXT,
  "evidenceDetail" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "onsetAge" DOUBLE PRECISION,
  "onsetDate" TIMESTAMPTZ,
  "onsetInfo" TEXT,
  "patient" TEXT,
  "recordedDate" TIMESTAMPTZ,
  "__severity" UUID[],
  "__severityText" TEXT[],
  "__severitySort" TEXT,
  "__stage" UUID[],
  "__stageText" TEXT[],
  "__stageSort" TEXT,
  "subject" TEXT,
  "__verificationStatus" UUID[],
  "__verificationStatusText" TEXT[],
  "__verificationStatusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Condition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Condition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Condition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Condition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Condition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Consent" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__action" UUID[],
  "__actionText" TEXT[],
  "__actionSort" TEXT,
  "actor" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "consentor" TEXT[],
  "data" TEXT[],
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "organization" TEXT[],
  "patient" TEXT,
  "period" TIMESTAMPTZ,
  "__purpose" UUID[],
  "__purposeText" TEXT[],
  "__purposeSort" TEXT,
  "__scope" UUID[],
  "__scopeText" TEXT[],
  "__scopeSort" TEXT,
  "__securityLabel" UUID[],
  "__securityLabelText" TEXT[],
  "__securityLabelSort" TEXT,
  "sourceReference" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Consent_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Consent_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Consent_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Consent_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Consent_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Contract" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authority" TEXT[],
  "domain" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiates" TEXT,
  "issued" TIMESTAMPTZ,
  "patient" TEXT[],
  "signer" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT[],
  "url" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Contract_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Contract_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Contract_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Contract_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Contract_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Coverage" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "beneficiary" TEXT,
  "__classType" UUID[],
  "__classTypeText" TEXT[],
  "__classTypeSort" TEXT,
  "classValue" TEXT[],
  "dependent" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "payor" TEXT[],
  "policyHolder" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subscriber" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Coverage_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Coverage_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Coverage_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Coverage_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Coverage_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "created" TIMESTAMPTZ,
  "enterer" TEXT,
  "facility" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "provider" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CoverageEligibilityRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CoverageEligibilityRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CoverageEligibilityRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "created" TIMESTAMPTZ,
  "disposition" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "insurer" TEXT,
  "__outcome" UUID[],
  "__outcomeText" TEXT[],
  "__outcomeSort" TEXT,
  "patient" TEXT,
  "request" TEXT,
  "requestor" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "CoverageEligibilityResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "CoverageEligibilityResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "CoverageEligibilityResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "CoverageEligibilityResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DetectedIssue" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "identified" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "implicated" TEXT[],
  "patient" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DetectedIssue_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DetectedIssue_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DetectedIssue_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DetectedIssue_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DetectedIssue_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Device" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "deviceName" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "organization" TEXT,
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "udiCarrier" TEXT[],
  "udiDi" TEXT[],
  "url" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Device_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Device_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Device_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Device_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Device_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DeviceDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "parent" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DeviceDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeviceDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DeviceDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DeviceDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DeviceDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DeviceMetric" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "parent" TEXT,
  "source" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DeviceMetric_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeviceMetric_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DeviceMetric_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DeviceMetric_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DeviceMetric_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DeviceRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authoredOn" TIMESTAMPTZ,
  "basedOn" TEXT[],
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "device" TEXT,
  "encounter" TEXT,
  "eventDate" TIMESTAMPTZ,
  "__groupIdentifier" UUID[],
  "__groupIdentifierText" TEXT[],
  "__groupIdentifierSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "insurance" TEXT[],
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "patient" TEXT,
  "performer" TEXT,
  "priorRequest" TEXT[],
  "requester" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DeviceRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeviceRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DeviceRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DeviceRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DeviceRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DeviceUseStatement" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "device" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DeviceUseStatement_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeviceUseStatement_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DeviceUseStatement_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DeviceUseStatement_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DeviceUseStatement_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DiagnosticReport" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedOn" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__conclusion" UUID[],
  "__conclusionText" TEXT[],
  "__conclusionSort" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "issued" TIMESTAMPTZ,
  "media" TEXT[],
  "patient" TEXT,
  "performer" TEXT[],
  "result" TEXT[],
  "resultsInterpreter" TEXT[],
  "specimen" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DiagnosticReport_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DiagnosticReport_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DiagnosticReport_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DiagnosticReport_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DiagnosticReport_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DocumentManifest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT[],
  "created" TIMESTAMPTZ,
  "description" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "item" TEXT[],
  "patient" TEXT,
  "recipient" TEXT[],
  "__relatedId" UUID[],
  "__relatedIdText" TEXT[],
  "__relatedIdSort" TEXT,
  "relatedRef" TEXT[],
  "source" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DocumentManifest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentManifest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DocumentManifest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DocumentManifest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DocumentManifest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "DocumentReference" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authenticator" TEXT,
  "author" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__contenttype" UUID[],
  "__contenttypeText" TEXT[],
  "__contenttypeSort" TEXT,
  "custodian" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "encounter" TEXT[],
  "__event" UUID[],
  "__eventText" TEXT[],
  "__eventSort" TEXT,
  "__facility" UUID[],
  "__facilityText" TEXT[],
  "__facilitySort" TEXT,
  "__format" UUID[],
  "__formatText" TEXT[],
  "__formatSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__language" UUID[],
  "__languageText" TEXT[],
  "__languageSort" TEXT,
  "location" TEXT[],
  "patient" TEXT,
  "period" TIMESTAMPTZ,
  "related" TEXT[],
  "relatesto" TEXT[],
  "__relation" UUID[],
  "__relationText" TEXT[],
  "__relationSort" TEXT,
  "__securityLabel" UUID[],
  "__securityLabelText" TEXT[],
  "__securityLabelSort" TEXT,
  "__setting" UUID[],
  "__settingText" TEXT[],
  "__settingSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "DocumentReference_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DocumentReference_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "DocumentReference_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "DocumentReference_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "DocumentReference_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EffectEvidenceSynthesis" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EffectEvidenceSynthesis_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EffectEvidenceSynthesis_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EffectEvidenceSynthesis_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EffectEvidenceSynthesis_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EffectEvidenceSynthesis_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Encounter" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "account" TEXT[],
  "appointment" TEXT[],
  "basedOn" TEXT[],
  "__class" UUID[],
  "__classText" TEXT[],
  "__classSort" TEXT,
  "date" TIMESTAMPTZ,
  "diagnosis" TEXT[],
  "episodeOfCare" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "length" DOUBLE PRECISION,
  "location" TEXT[],
  "locationPeriod" TIMESTAMPTZ[],
  "partOf" TEXT,
  "participant" TEXT[],
  "__participantType" UUID[],
  "__participantTypeText" TEXT[],
  "__participantTypeSort" TEXT,
  "patient" TEXT,
  "practitioner" TEXT[],
  "__reasonCode" UUID[],
  "__reasonCodeText" TEXT[],
  "__reasonCodeSort" TEXT,
  "reasonReference" TEXT[],
  "serviceProvider" TEXT,
  "__specialArrangement" UUID[],
  "__specialArrangementText" TEXT[],
  "__specialArrangementSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Encounter_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Encounter_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Encounter_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Encounter_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Encounter_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Endpoint" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__connectionType" UUID[],
  "__connectionTypeText" TEXT[],
  "__connectionTypeSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "organization" TEXT,
  "__payloadType" UUID[],
  "__payloadTypeText" TEXT[],
  "__payloadTypeSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Endpoint_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Endpoint_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Endpoint_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Endpoint_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Endpoint_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EnrollmentRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EnrollmentRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EnrollmentRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EnrollmentRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EnrollmentRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EnrollmentRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EnrollmentResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "request" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EnrollmentResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EnrollmentResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EnrollmentResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EnrollmentResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EnrollmentResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EpisodeOfCare" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "careManager" TEXT,
  "condition" TEXT[],
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "incomingReferral" TEXT[],
  "organization" TEXT,
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EpisodeOfCare_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EpisodeOfCare_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EpisodeOfCare_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EpisodeOfCare_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EpisodeOfCare_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EventDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EventDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EventDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EventDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EventDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Evidence" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Evidence_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Evidence_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Evidence_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Evidence_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Evidence_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "EvidenceVariable" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "EvidenceVariable_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EvidenceVariable_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "EvidenceVariable_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "EvidenceVariable_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "EvidenceVariable_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ExampleScenario" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ExampleScenario_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExampleScenario_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ExampleScenario_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ExampleScenario_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ExampleScenario_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ExplanationOfBenefit" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "careTeam" TEXT[],
  "claim" TEXT,
  "coverage" TEXT[],
  "created" TIMESTAMPTZ,
  "detailUdi" TEXT[],
  "disposition" TEXT,
  "encounter" TEXT[],
  "enterer" TEXT,
  "facility" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "itemUdi" TEXT[],
  "patient" TEXT,
  "payee" TEXT,
  "procedureUdi" TEXT[],
  "provider" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subdetailUdi" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ExplanationOfBenefit_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExplanationOfBenefit_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ExplanationOfBenefit_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ExplanationOfBenefit_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ExplanationOfBenefit_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "FamilyMemberHistory" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "patient" TEXT,
  "__relationship" UUID[],
  "__relationshipText" TEXT[],
  "__relationshipSort" TEXT,
  "__sex" UUID[],
  "__sexText" TEXT[],
  "__sexSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "FamilyMemberHistory_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FamilyMemberHistory_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "FamilyMemberHistory_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "FamilyMemberHistory_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "FamilyMemberHistory_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Flag" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Flag_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Flag_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Flag_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Flag_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Flag_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Goal" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__achievementStatus" UUID[],
  "__achievementStatusText" TEXT[],
  "__achievementStatusSort" TEXT,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__lifecycleStatus" UUID[],
  "__lifecycleStatusText" TEXT[],
  "__lifecycleStatusSort" TEXT,
  "patient" TEXT,
  "startDate" TIMESTAMPTZ,
  "subject" TEXT,
  "targetDate" TIMESTAMPTZ[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Goal_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Goal_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Goal_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Goal_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Goal_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "GraphDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__start" UUID[],
  "__startText" TEXT[],
  "__startSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "GraphDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GraphDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "GraphDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "GraphDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "GraphDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Group" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__actual" UUID[],
  "__actualText" TEXT[],
  "__actualSort" TEXT,
  "__characteristic" UUID[],
  "__characteristicText" TEXT[],
  "__characteristicSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__exclude" UUID[],
  "__excludeText" TEXT[],
  "__excludeSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "managingEntity" TEXT,
  "member" TEXT[],
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__value" UUID[],
  "__valueText" TEXT[],
  "__valueSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Group_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Group_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Group_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Group_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Group_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "GuidanceResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "__request" UUID[],
  "__requestText" TEXT[],
  "__requestSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "GuidanceResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuidanceResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "GuidanceResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "GuidanceResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "GuidanceResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "HealthcareService" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "__characteristic" UUID[],
  "__characteristicText" TEXT[],
  "__characteristicSort" TEXT,
  "coverageArea" TEXT[],
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT[],
  "__nameSort" TEXT,
  "organization" TEXT,
  "__program" UUID[],
  "__programText" TEXT[],
  "__programSort" TEXT,
  "__serviceCategory" UUID[],
  "__serviceCategoryText" TEXT[],
  "__serviceCategorySort" TEXT,
  "__serviceType" UUID[],
  "__serviceTypeText" TEXT[],
  "__serviceTypeSort" TEXT,
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "HealthcareService_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HealthcareService_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "HealthcareService_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "HealthcareService_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "HealthcareService_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ImagingStudy" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedon" TEXT[],
  "__bodysite" UUID[],
  "__bodysiteText" TEXT[],
  "__bodysiteSort" TEXT,
  "__dicomClass" UUID[],
  "__dicomClassText" TEXT[],
  "__dicomClassSort" TEXT,
  "encounter" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__instance" UUID[],
  "__instanceText" TEXT[],
  "__instanceSort" TEXT,
  "interpreter" TEXT[],
  "__modality" UUID[],
  "__modalityText" TEXT[],
  "__modalitySort" TEXT,
  "patient" TEXT,
  "performer" TEXT[],
  "__reason" UUID[],
  "__reasonText" TEXT[],
  "__reasonSort" TEXT,
  "referrer" TEXT,
  "__series" UUID[],
  "__seriesText" TEXT[],
  "__seriesSort" TEXT,
  "started" TIMESTAMPTZ,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ImagingStudy_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImagingStudy_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ImagingStudy_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ImagingStudy_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ImagingStudy_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Immunization" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT,
  "lotNumber" TEXT,
  "manufacturer" TEXT,
  "patient" TEXT,
  "performer" TEXT[],
  "reaction" TEXT[],
  "reactionDate" TIMESTAMPTZ[],
  "__reasonCode" UUID[],
  "__reasonCodeText" TEXT[],
  "__reasonCodeSort" TEXT,
  "reasonReference" TEXT[],
  "series" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__statusReason" UUID[],
  "__statusReasonText" TEXT[],
  "__statusReasonSort" TEXT,
  "__targetDisease" UUID[],
  "__targetDiseaseText" TEXT[],
  "__targetDiseaseSort" TEXT,
  "__vaccineCode" UUID[],
  "__vaccineCodeText" TEXT[],
  "__vaccineCodeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Immunization_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Immunization_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Immunization_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Immunization_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Immunization_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ImmunizationEvaluation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "date" TIMESTAMPTZ,
  "__doseStatus" UUID[],
  "__doseStatusText" TEXT[],
  "__doseStatusSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "immunizationEvent" TEXT,
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__targetDisease" UUID[],
  "__targetDiseaseText" TEXT[],
  "__targetDiseaseSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ImmunizationEvaluation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImmunizationEvaluation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ImmunizationEvaluation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ImmunizationEvaluation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ImmunizationEvaluation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ImmunizationRecommendation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "information" TEXT[],
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "support" TEXT[],
  "__targetDisease" UUID[],
  "__targetDiseaseText" TEXT[],
  "__targetDiseaseSort" TEXT,
  "__vaccineType" UUID[],
  "__vaccineTypeText" TEXT[],
  "__vaccineTypeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ImmunizationRecommendation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImmunizationRecommendation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ImmunizationRecommendation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ImmunizationRecommendation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ImmunizationRecommendation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ImplementationGuide" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "description" TEXT,
  "__experimental" UUID[],
  "__experimentalText" TEXT[],
  "__experimentalSort" TEXT,
  "global" TEXT[],
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "resource" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ImplementationGuide_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ImplementationGuide_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ImplementationGuide_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ImplementationGuide_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ImplementationGuide_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "InsurancePlan" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "administeredBy" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "name" TEXT,
  "ownedBy" TEXT,
  "__phoneticSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "InsurancePlan_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsurancePlan_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "InsurancePlan_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "InsurancePlan_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "InsurancePlan_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "account" TEXT,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "issuer" TEXT,
  "participant" TEXT[],
  "__participantRole" UUID[],
  "__participantRoleText" TEXT[],
  "__participantRoleSort" TEXT,
  "patient" TEXT,
  "recipient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "totalgross" DOUBLE PRECISION,
  "totalnet" DOUBLE PRECISION,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Invoice_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Invoice_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Invoice_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Invoice_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Invoice_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Library" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__contentType" UUID[],
  "__contentTypeText" TEXT[],
  "__contentTypeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Library_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Library_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Library_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Library_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Library_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Linkage" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "item" TEXT[],
  "source" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Linkage_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Linkage_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Linkage_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Linkage_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Linkage_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "List" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__emptyReason" UUID[],
  "__emptyReasonText" TEXT[],
  "__emptyReasonSort" TEXT,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "item" TEXT[],
  "notes" TEXT[],
  "patient" TEXT,
  "source" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "title" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "List_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "List_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "List_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "List_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "List_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Location" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "__operationalStatus" UUID[],
  "__operationalStatusText" TEXT[],
  "__operationalStatusSort" TEXT,
  "organization" TEXT,
  "partof" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Location_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Location_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Location_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Location_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Location_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Measure" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Measure_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Measure_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Measure_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Measure_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Measure_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MeasureReport" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "date" TIMESTAMPTZ,
  "evaluatedResource" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "measure" TEXT,
  "patient" TEXT,
  "period" TIMESTAMPTZ,
  "reporter" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MeasureReport_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MeasureReport_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MeasureReport_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MeasureReport_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MeasureReport_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Media" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedOn" TEXT[],
  "created" TIMESTAMPTZ,
  "device" TEXT,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__modality" UUID[],
  "__modalityText" TEXT[],
  "__modalitySort" TEXT,
  "operator" TEXT,
  "patient" TEXT,
  "__site" UUID[],
  "__siteText" TEXT[],
  "__siteSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__view" UUID[],
  "__viewText" TEXT[],
  "__viewSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Media_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Media_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Media_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Media_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Media_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Medication" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "expirationDate" TIMESTAMPTZ,
  "__form" UUID[],
  "__formText" TEXT[],
  "__formSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "ingredient" TEXT[],
  "__ingredientCode" UUID[],
  "__ingredientCodeText" TEXT[],
  "__ingredientCodeSort" TEXT,
  "__lotNumber" UUID[],
  "__lotNumberText" TEXT[],
  "__lotNumberSort" TEXT,
  "manufacturer" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Medication_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Medication_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Medication_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Medication_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Medication_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicationAdministration" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "context" TEXT,
  "device" TEXT[],
  "effectiveTime" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "medication" TEXT,
  "patient" TEXT,
  "performer" TEXT[],
  "__reasonGiven" UUID[],
  "__reasonGivenText" TEXT[],
  "__reasonGivenSort" TEXT,
  "__reasonNotGiven" UUID[],
  "__reasonNotGivenText" TEXT[],
  "__reasonNotGivenSort" TEXT,
  "request" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicationAdministration_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicationAdministration_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicationAdministration_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicationAdministration_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicationAdministration_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicationDispense" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "context" TEXT,
  "destination" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "medication" TEXT,
  "patient" TEXT,
  "performer" TEXT[],
  "prescription" TEXT[],
  "receiver" TEXT[],
  "responsibleparty" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "whenhandedover" TIMESTAMPTZ,
  "whenprepared" TIMESTAMPTZ,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicationDispense_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicationDispense_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicationDispense_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicationDispense_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicationDispense_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicationKnowledge" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__classification" UUID[],
  "__classificationText" TEXT[],
  "__classificationSort" TEXT,
  "__classificationType" UUID[],
  "__classificationTypeText" TEXT[],
  "__classificationTypeSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__doseform" UUID[],
  "__doseformText" TEXT[],
  "__doseformSort" TEXT,
  "ingredient" TEXT[],
  "__ingredientCode" UUID[],
  "__ingredientCodeText" TEXT[],
  "__ingredientCodeSort" TEXT,
  "manufacturer" TEXT,
  "__monitoringProgramName" UUID[],
  "__monitoringProgramNameText" TEXT[],
  "__monitoringProgramNameSort" TEXT,
  "__monitoringProgramType" UUID[],
  "__monitoringProgramTypeText" TEXT[],
  "__monitoringProgramTypeSort" TEXT,
  "monograph" TEXT[],
  "__monographType" UUID[],
  "__monographTypeText" TEXT[],
  "__monographTypeSort" TEXT,
  "__sourceCost" UUID[],
  "__sourceCostText" TEXT[],
  "__sourceCostSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicationKnowledge_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicationKnowledge_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicationKnowledge_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicationKnowledge_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicationKnowledge_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicationRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authoredon" TIMESTAMPTZ,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "date" TIMESTAMPTZ[],
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "intendedDispenser" TEXT,
  "intendedPerformer" TEXT,
  "__intendedPerformertype" UUID[],
  "__intendedPerformertypeText" TEXT[],
  "__intendedPerformertypeSort" TEXT,
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "medication" TEXT,
  "patient" TEXT,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "requester" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicationRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicationRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicationRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicationRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicationRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicationStatement" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "context" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "medication" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "source" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicationStatement_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicationStatement_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicationStatement_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicationStatement_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicationStatement_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProduct" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "__nameLanguage" UUID[],
  "__nameLanguageText" TEXT[],
  "__nameLanguageSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProduct_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProduct_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProduct_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProduct_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProduct_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductAuthorization" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__country" UUID[],
  "__countryText" TEXT[],
  "__countrySort" TEXT,
  "holder" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductAuthorization_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductAuthorization_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductAuthorization_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductAuthorization_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductAuthorization_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductContraindication" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "subject" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductContraindication_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductContraindication_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductContraindication_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductContraindication_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductContraindication_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIndication" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "subject" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductIndication_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIndication_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductIndication_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIndication_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductIndication_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIngredient" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductIngredient_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIngredient_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductIngredient_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductIngredient_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductIngredient_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductInteraction" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "subject" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductInteraction_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductInteraction_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductInteraction_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductInteraction_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductInteraction_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductManufactured" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductManufactured_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductManufactured_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductManufactured_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductManufactured_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductManufactured_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPackaged" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "subject" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductPackaged_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPackaged_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductPackaged_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPackaged_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductPackaged_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPharmaceutical" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__route" UUID[],
  "__routeText" TEXT[],
  "__routeSort" TEXT,
  "__targetSpecies" UUID[],
  "__targetSpeciesText" TEXT[],
  "__targetSpeciesSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductPharmaceutical_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPharmaceutical_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductPharmaceutical_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductPharmaceutical_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductPharmaceutical_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductUndesirableEffect" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "subject" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MedicinalProductUndesirableEffect_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductUndesirableEffect_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MedicinalProductUndesirableEffect_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MedicinalProductUndesirableEffect_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MedicinalProductUndesirableEffect_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MessageDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__event" UUID[],
  "__eventText" TEXT[],
  "__eventSort" TEXT,
  "__focus" UUID[],
  "__focusText" TEXT[],
  "__focusSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "parent" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MessageDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessageDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MessageDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MessageDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MessageDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MessageHeader" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "destination" TEXT[],
  "destinationUri" TEXT[],
  "enterer" TEXT,
  "__event" UUID[],
  "__eventText" TEXT[],
  "__eventSort" TEXT,
  "focus" TEXT[],
  "receiver" TEXT[],
  "__responseId" UUID[],
  "__responseIdText" TEXT[],
  "__responseIdSort" TEXT,
  "responsible" TEXT,
  "sender" TEXT,
  "source" TEXT,
  "sourceUri" TEXT,
  "target" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MessageHeader_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessageHeader_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MessageHeader_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MessageHeader_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MessageHeader_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "MolecularSequence" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__chromosome" UUID[],
  "__chromosomeText" TEXT[],
  "__chromosomeSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "__referenceseqid" UUID[],
  "__referenceseqidText" TEXT[],
  "__referenceseqidSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "variantEnd" DOUBLE PRECISION[],
  "variantStart" DOUBLE PRECISION[],
  "windowEnd" DOUBLE PRECISION,
  "windowStart" DOUBLE PRECISION,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "MolecularSequence_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MolecularSequence_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "MolecularSequence_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "MolecularSequence_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "MolecularSequence_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "NamingSystem" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "contact" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__idType" UUID[],
  "__idTypeText" TEXT[],
  "__idTypeSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__kind" UUID[],
  "__kindText" TEXT[],
  "__kindSort" TEXT,
  "__nameSort" TEXT,
  "period" TIMESTAMPTZ[],
  "publisher" TEXT,
  "responsible" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__telecomSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "value" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "NamingSystem_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NamingSystem_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "NamingSystem_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "NamingSystem_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "NamingSystem_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "NutritionOrder" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__additive" UUID[],
  "__additiveText" TEXT[],
  "__additiveSort" TEXT,
  "datetime" TIMESTAMPTZ,
  "encounter" TEXT,
  "__formula" UUID[],
  "__formulaText" TEXT[],
  "__formulaSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "__oraldiet" UUID[],
  "__oraldietText" TEXT[],
  "__oraldietSort" TEXT,
  "patient" TEXT,
  "provider" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__supplement" UUID[],
  "__supplementText" TEXT[],
  "__supplementSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "NutritionOrder_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NutritionOrder_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "NutritionOrder_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "NutritionOrder_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "NutritionOrder_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Observation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedOn" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__comboCode" UUID[],
  "__comboCodeText" TEXT[],
  "__comboCodeSort" TEXT,
  "__comboDataAbsentReason" UUID[],
  "__comboDataAbsentReasonText" TEXT[],
  "__comboDataAbsentReasonSort" TEXT,
  "__comboValueConcept" UUID[],
  "__comboValueConceptText" TEXT[],
  "__comboValueConceptSort" TEXT,
  "comboValueQuantity" DOUBLE PRECISION[],
  "__componentCode" UUID[],
  "__componentCodeText" TEXT[],
  "__componentCodeSort" TEXT,
  "__componentDataAbsentReason" UUID[],
  "__componentDataAbsentReasonText" TEXT[],
  "__componentDataAbsentReasonSort" TEXT,
  "__componentValueConcept" UUID[],
  "__componentValueConceptText" TEXT[],
  "__componentValueConceptSort" TEXT,
  "componentValueQuantity" DOUBLE PRECISION[],
  "__dataAbsentReason" UUID[],
  "__dataAbsentReasonText" TEXT[],
  "__dataAbsentReasonSort" TEXT,
  "date" TIMESTAMPTZ,
  "derivedFrom" TEXT[],
  "device" TEXT,
  "encounter" TEXT,
  "focus" TEXT[],
  "hasMember" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__method" UUID[],
  "__methodText" TEXT[],
  "__methodSort" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "performer" TEXT[],
  "specimen" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__valueConcept" UUID[],
  "__valueConceptText" TEXT[],
  "__valueConceptSort" TEXT,
  "valueDate" TIMESTAMPTZ,
  "valueQuantity" DOUBLE PRECISION,
  "valueString" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Observation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Observation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Observation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Observation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Observation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ObservationDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ObservationDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ObservationDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ObservationDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ObservationDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ObservationDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "OperationDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "base" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "inputProfile" TEXT,
  "__instance" UUID[],
  "__instanceText" TEXT[],
  "__instanceSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__kind" UUID[],
  "__kindText" TEXT[],
  "__kindSort" TEXT,
  "__nameSort" TEXT,
  "outputProfile" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__system" UUID[],
  "__systemText" TEXT[],
  "__systemSort" TEXT,
  "title" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "OperationDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OperationDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "OperationDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "OperationDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "OperationDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "OperationOutcome" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "OperationOutcome_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OperationOutcome_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "OperationOutcome_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "OperationOutcome_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "OperationOutcome_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "partof" TEXT,
  "__phoneticSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Organization_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Organization_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Organization_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Organization_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Organization_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "OrganizationAffiliation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__emailSort" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT[],
  "network" TEXT[],
  "participatingOrganization" TEXT,
  "__phoneSort" TEXT,
  "primaryOrganization" TEXT,
  "__role" UUID[],
  "__roleText" TEXT[],
  "__roleSort" TEXT,
  "service" TEXT[],
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "OrganizationAffiliation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrganizationAffiliation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "OrganizationAffiliation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "OrganizationAffiliation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "OrganizationAffiliation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Parameters" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Parameters_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Parameters_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Parameters_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Parameters_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Parameters_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Patient" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "birthdate" TIMESTAMPTZ,
  "deathDate" TIMESTAMPTZ,
  "__deceased" UUID[],
  "__deceasedText" TEXT[],
  "__deceasedSort" TEXT,
  "__emailSort" TEXT,
  "__familySort" TEXT,
  "__gender" UUID[],
  "__genderText" TEXT[],
  "__genderSort" TEXT,
  "generalPractitioner" TEXT[],
  "__givenSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__language" UUID[],
  "__languageText" TEXT[],
  "__languageSort" TEXT,
  "link" TEXT[],
  "__nameSort" TEXT,
  "organization" TEXT,
  "__phoneSort" TEXT,
  "__phoneticSort" TEXT,
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Patient_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Patient_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Patient_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Patient_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Patient_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "PaymentNotice" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "created" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__paymentStatus" UUID[],
  "__paymentStatusText" TEXT[],
  "__paymentStatusSort" TEXT,
  "provider" TEXT,
  "request" TEXT,
  "response" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "PaymentNotice_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentNotice_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "PaymentNotice_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "PaymentNotice_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "PaymentNotice_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "PaymentReconciliation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "created" TIMESTAMPTZ,
  "disposition" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__outcome" UUID[],
  "__outcomeText" TEXT[],
  "__outcomeSort" TEXT,
  "paymentIssuer" TEXT,
  "request" TEXT,
  "requestor" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "PaymentReconciliation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentReconciliation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "PaymentReconciliation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "PaymentReconciliation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "PaymentReconciliation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Person" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "birthdate" TIMESTAMPTZ,
  "__emailSort" TEXT,
  "__gender" UUID[],
  "__genderText" TEXT[],
  "__genderSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "link" TEXT[],
  "__nameSort" TEXT,
  "organization" TEXT,
  "patient" TEXT[],
  "__phoneSort" TEXT,
  "__phoneticSort" TEXT,
  "practitioner" TEXT[],
  "relatedperson" TEXT[],
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Person_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Person_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Person_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Person_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Person_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "PlanDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "definition" TEXT[],
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "PlanDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlanDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "PlanDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "PlanDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "PlanDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Practitioner" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "__communication" UUID[],
  "__communicationText" TEXT[],
  "__communicationSort" TEXT,
  "__emailSort" TEXT,
  "__familySort" TEXT,
  "__gender" UUID[],
  "__genderText" TEXT[],
  "__genderSort" TEXT,
  "__givenSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "__phoneSort" TEXT,
  "__phoneticSort" TEXT,
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Practitioner_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Practitioner_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Practitioner_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Practitioner_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Practitioner_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "PractitionerRole" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__emailSort" TEXT,
  "endpoint" TEXT[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "location" TEXT[],
  "organization" TEXT,
  "__phoneSort" TEXT,
  "practitioner" TEXT,
  "__role" UUID[],
  "__roleText" TEXT[],
  "__roleSort" TEXT,
  "service" TEXT[],
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "PractitionerRole_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PractitionerRole_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "PractitionerRole_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "PractitionerRole_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "PractitionerRole_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Procedure" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "basedOn" TEXT[],
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "location" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "performer" TEXT[],
  "__reasonCode" UUID[],
  "__reasonCodeText" TEXT[],
  "__reasonCodeSort" TEXT,
  "reasonReference" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Procedure_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Procedure_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Procedure_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Procedure_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Procedure_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Provenance" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "agent" TEXT[],
  "__agentRole" UUID[],
  "__agentRoleText" TEXT[],
  "__agentRoleSort" TEXT,
  "__agentType" UUID[],
  "__agentTypeText" TEXT[],
  "__agentTypeSort" TEXT,
  "entity" TEXT[],
  "location" TEXT,
  "patient" TEXT[],
  "recorded" TIMESTAMPTZ,
  "__signatureType" UUID[],
  "__signatureTypeText" TEXT[],
  "__signatureTypeSort" TEXT,
  "target" TEXT[],
  "when" TIMESTAMPTZ,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Provenance_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Provenance_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Provenance_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Provenance_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Provenance_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Questionnaire" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "definition" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__subjectType" UUID[],
  "__subjectTypeText" TEXT[],
  "__subjectTypeSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Questionnaire_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Questionnaire_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Questionnaire_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Questionnaire_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Questionnaire_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "QuestionnaireResponse" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "authored" TIMESTAMPTZ,
  "basedOn" TEXT[],
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "questionnaire" TEXT,
  "source" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "QuestionnaireResponse_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuestionnaireResponse_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "QuestionnaireResponse_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "QuestionnaireResponse_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "QuestionnaireResponse_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "RelatedPerson" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "__addressSort" TEXT,
  "__addressCitySort" TEXT,
  "__addressCountrySort" TEXT,
  "__addressPostalcodeSort" TEXT,
  "__addressStateSort" TEXT,
  "__addressUseSort" TEXT,
  "birthdate" TIMESTAMPTZ,
  "__emailSort" TEXT,
  "__gender" UUID[],
  "__genderText" TEXT[],
  "__genderSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__nameSort" TEXT,
  "patient" TEXT,
  "__phoneSort" TEXT,
  "__phoneticSort" TEXT,
  "__relationship" UUID[],
  "__relationshipText" TEXT[],
  "__relationshipSort" TEXT,
  "__telecomSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "RelatedPerson_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RelatedPerson_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "RelatedPerson_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "RelatedPerson_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "RelatedPerson_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "RequestGroup" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "author" TEXT,
  "authored" TIMESTAMPTZ,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "encounter" TEXT,
  "__groupIdentifier" UUID[],
  "__groupIdentifierText" TEXT[],
  "__groupIdentifierSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "participant" TEXT[],
  "patient" TEXT,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "RequestGroup_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RequestGroup_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "RequestGroup_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "RequestGroup_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "RequestGroup_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ResearchDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ResearchDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResearchDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ResearchDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ResearchDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ResearchDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ResearchElementDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "composedOf" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "dependsOn" TEXT[],
  "derivedFrom" TEXT[],
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "predecessor" TEXT[],
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "successor" TEXT[],
  "title" TEXT,
  "__topic" UUID[],
  "__topicText" TEXT[],
  "__topicSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ResearchElementDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResearchElementDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ResearchElementDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ResearchElementDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ResearchElementDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ResearchStudy" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "date" TIMESTAMPTZ,
  "__focus" UUID[],
  "__focusText" TEXT[],
  "__focusSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__keyword" UUID[],
  "__keywordText" TEXT[],
  "__keywordSort" TEXT,
  "__location" UUID[],
  "__locationText" TEXT[],
  "__locationSort" TEXT,
  "partof" TEXT[],
  "principalinvestigator" TEXT,
  "protocol" TEXT[],
  "site" TEXT[],
  "sponsor" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ResearchStudy_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResearchStudy_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ResearchStudy_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ResearchStudy_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ResearchStudy_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ResearchSubject" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "individual" TEXT,
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "study" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ResearchSubject_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ResearchSubject_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ResearchSubject_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ResearchSubject_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ResearchSubject_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "RiskAssessment" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "condition" TEXT,
  "date" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__method" UUID[],
  "__methodText" TEXT[],
  "__methodSort" TEXT,
  "patient" TEXT,
  "performer" TEXT,
  "probability" DOUBLE PRECISION[],
  "__risk" UUID[],
  "__riskText" TEXT[],
  "__riskSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "RiskAssessment_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiskAssessment_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "RiskAssessment_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "RiskAssessment_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "RiskAssessment_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "RiskEvidenceSynthesis" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "effective" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "RiskEvidenceSynthesis_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RiskEvidenceSynthesis_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "RiskEvidenceSynthesis_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "RiskEvidenceSynthesis_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "RiskEvidenceSynthesis_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Schedule" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__active" UUID[],
  "__activeText" TEXT[],
  "__activeSort" TEXT,
  "actor" TEXT[],
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__serviceCategory" UUID[],
  "__serviceCategoryText" TEXT[],
  "__serviceCategorySort" TEXT,
  "__serviceType" UUID[],
  "__serviceTypeText" TEXT[],
  "__serviceTypeSort" TEXT,
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Schedule_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Schedule_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Schedule_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Schedule_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Schedule_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SearchParameter" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__base" UUID[],
  "__baseText" TEXT[],
  "__baseSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "component" TEXT[],
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "derivedFrom" TEXT,
  "description" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__target" UUID[],
  "__targetText" TEXT[],
  "__targetSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SearchParameter_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SearchParameter_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SearchParameter_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SearchParameter_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SearchParameter_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ServiceRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authored" TIMESTAMPTZ,
  "basedOn" TEXT[],
  "__bodySite" UUID[],
  "__bodySiteText" TEXT[],
  "__bodySiteSort" TEXT,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "instantiatesCanonical" TEXT[],
  "instantiatesUri" TEXT[],
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "occurrence" TIMESTAMPTZ,
  "patient" TEXT,
  "performer" TEXT[],
  "__performerType" UUID[],
  "__performerTypeText" TEXT[],
  "__performerTypeSort" TEXT,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "replaces" TEXT[],
  "requester" TEXT,
  "__requisition" UUID[],
  "__requisitionText" TEXT[],
  "__requisitionSort" TEXT,
  "specimen" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ServiceRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ServiceRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ServiceRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ServiceRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ServiceRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Slot" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__appointmentType" UUID[],
  "__appointmentTypeText" TEXT[],
  "__appointmentTypeSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "schedule" TEXT,
  "__serviceCategory" UUID[],
  "__serviceCategoryText" TEXT[],
  "__serviceCategorySort" TEXT,
  "__serviceType" UUID[],
  "__serviceTypeText" TEXT[],
  "__serviceTypeSort" TEXT,
  "__specialty" UUID[],
  "__specialtyText" TEXT[],
  "__specialtySort" TEXT,
  "start" TIMESTAMPTZ,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Slot_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Slot_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Slot_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Slot_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Slot_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Specimen" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__accession" UUID[],
  "__accessionText" TEXT[],
  "__accessionSort" TEXT,
  "__bodysite" UUID[],
  "__bodysiteText" TEXT[],
  "__bodysiteSort" TEXT,
  "collected" TIMESTAMPTZ,
  "collector" TEXT,
  "__container" UUID[],
  "__containerText" TEXT[],
  "__containerSort" TEXT,
  "__containerId" UUID[],
  "__containerIdText" TEXT[],
  "__containerIdSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "parent" TEXT[],
  "patient" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Specimen_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Specimen_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Specimen_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Specimen_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Specimen_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SpecimenDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__container" UUID[],
  "__containerText" TEXT[],
  "__containerSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SpecimenDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SpecimenDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SpecimenDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SpecimenDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SpecimenDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "StructureDefinition" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__abstract" UUID[],
  "__abstractText" TEXT[],
  "__abstractSort" TEXT,
  "base" TEXT,
  "__basePath" UUID[],
  "__basePathText" TEXT[],
  "__basePathSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "__derivation" UUID[],
  "__derivationText" TEXT[],
  "__derivationSort" TEXT,
  "description" TEXT,
  "__experimental" UUID[],
  "__experimentalText" TEXT[],
  "__experimentalSort" TEXT,
  "__extContext" UUID[],
  "__extContextText" TEXT[],
  "__extContextSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__keyword" UUID[],
  "__keywordText" TEXT[],
  "__keywordSort" TEXT,
  "__kind" UUID[],
  "__kindText" TEXT[],
  "__kindSort" TEXT,
  "__nameSort" TEXT,
  "__path" UUID[],
  "__pathText" TEXT[],
  "__pathSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "type" TEXT,
  "url" TEXT,
  "valueset" TEXT[],
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "StructureDefinition_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StructureDefinition_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "StructureDefinition_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "StructureDefinition_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "StructureDefinition_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "StructureMap" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "StructureMap_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StructureMap_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "StructureMap_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "StructureMap_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "StructureMap_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__contact" UUID[],
  "__contactText" TEXT[],
  "__contactSort" TEXT,
  "criteria" TEXT,
  "__payload" UUID[],
  "__payloadText" TEXT[],
  "__payloadSort" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__type" UUID[],
  "__typeText" TEXT[],
  "__typeSort" TEXT,
  "url" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Subscription_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Subscription_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Subscription_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Subscription_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Substance" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__containerIdentifier" UUID[],
  "__containerIdentifierText" TEXT[],
  "__containerIdentifierSort" TEXT,
  "expiry" TIMESTAMPTZ[],
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "quantity" DOUBLE PRECISION[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "substanceReference" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Substance_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Substance_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Substance_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Substance_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Substance_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstanceNucleicAcid" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstanceNucleicAcid_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstanceNucleicAcid_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstanceNucleicAcid_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstanceNucleicAcid_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstanceNucleicAcid_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstancePolymer" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstancePolymer_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstancePolymer_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstancePolymer_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstancePolymer_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstancePolymer_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstanceProtein" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstanceProtein_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstanceProtein_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstanceProtein_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstanceProtein_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstanceProtein_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstanceReferenceInformation" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstanceReferenceInformation_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstanceReferenceInformation_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstanceReferenceInformation_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstanceReferenceInformation_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstanceReferenceInformation_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstanceSourceMaterial" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstanceSourceMaterial_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstanceSourceMaterial_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstanceSourceMaterial_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstanceSourceMaterial_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstanceSourceMaterial_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SubstanceSpecification" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SubstanceSpecification_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubstanceSpecification_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SubstanceSpecification_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SubstanceSpecification_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SubstanceSpecification_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SupplyDelivery" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "receiver" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "supplier" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SupplyDelivery_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupplyDelivery_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SupplyDelivery_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SupplyDelivery_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SupplyDelivery_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "SupplyRequest" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__category" UUID[],
  "__categoryText" TEXT[],
  "__categorySort" TEXT,
  "date" TIMESTAMPTZ,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "requester" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "supplier" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "SupplyRequest_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SupplyRequest_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SupplyRequest_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "SupplyRequest_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "SupplyRequest_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "Task" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "authoredOn" TIMESTAMPTZ,
  "basedOn" TEXT[],
  "__businessStatus" UUID[],
  "__businessStatusText" TEXT[],
  "__businessStatusSort" TEXT,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "encounter" TEXT,
  "focus" TEXT,
  "__groupIdentifier" UUID[],
  "__groupIdentifierText" TEXT[],
  "__groupIdentifierSort" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__intent" UUID[],
  "__intentText" TEXT[],
  "__intentSort" TEXT,
  "modified" TIMESTAMPTZ,
  "owner" TEXT,
  "partOf" TEXT[],
  "patient" TEXT,
  "__performer" UUID[],
  "__performerText" TEXT[],
  "__performerSort" TEXT,
  "period" TIMESTAMPTZ,
  "__priority" UUID[],
  "__priorityText" TEXT[],
  "__prioritySort" TEXT,
  "requester" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "subject" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "Task_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Task_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "Task_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "Task_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "Task_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "TerminologyCapabilities" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "TerminologyCapabilities_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TerminologyCapabilities_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "TerminologyCapabilities_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "TerminologyCapabilities_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "TerminologyCapabilities_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "TestReport" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "issued" TIMESTAMPTZ,
  "participant" TEXT[],
  "__result" UUID[],
  "__resultText" TEXT[],
  "__resultSort" TEXT,
  "tester" TEXT,
  "testscript" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "TestReport_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TestReport_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "TestReport_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "TestReport_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "TestReport_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "TestScript" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "testscriptCapability" TEXT[],
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "TestScript_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TestScript_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "TestScript_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "TestScript_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "TestScript_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "ValueSet" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "__code" UUID[],
  "__codeText" TEXT[],
  "__codeSort" TEXT,
  "__context" UUID[],
  "__contextText" TEXT[],
  "__contextSort" TEXT,
  "contextQuantity" DOUBLE PRECISION[],
  "__contextType" UUID[],
  "__contextTypeText" TEXT[],
  "__contextTypeSort" TEXT,
  "date" TIMESTAMPTZ,
  "description" TEXT,
  "expansion" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "__jurisdiction" UUID[],
  "__jurisdictionText" TEXT[],
  "__jurisdictionSort" TEXT,
  "__nameSort" TEXT,
  "publisher" TEXT,
  "reference" TEXT[],
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "title" TEXT,
  "url" TEXT,
  "version" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "ValueSet_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ValueSet_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "ValueSet_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "ValueSet_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "ValueSet_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "VerificationResult" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "target" TEXT[],
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "VerificationResult_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationResult_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "VerificationResult_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "VerificationResult_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "VerificationResult_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE TABLE IF NOT EXISTS "VisionPrescription" (
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT false,
  "projectId" UUID NOT NULL,
  "__version" INTEGER NOT NULL,
  "_source" TEXT,
  "_profile" TEXT[],
  "___tag" UUID[],
  "___tagText" TEXT[],
  "___tagSort" TEXT,
  "___security" UUID[],
  "___securityText" TEXT[],
  "___securitySort" TEXT,
  "compartments" UUID[] NOT NULL,
  "datewritten" TIMESTAMPTZ,
  "encounter" TEXT,
  "__identifier" UUID[],
  "__identifierText" TEXT[],
  "__identifierSort" TEXT,
  "patient" TEXT,
  "prescriber" TEXT,
  "__status" UUID[],
  "__statusText" TEXT[],
  "__statusSort" TEXT,
  "__sharedTokens" UUID[],
  "__sharedTokensText" TEXT[],
  CONSTRAINT "VisionPrescription_pk" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VisionPrescription_History" (
  "versionId" UUID NOT NULL,
  "id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "lastUpdated" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "VisionPrescription_History_pk" PRIMARY KEY ("versionId")
);

CREATE TABLE IF NOT EXISTS "VisionPrescription_References" (
  "resourceId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  CONSTRAINT "VisionPrescription_References_pk" PRIMARY KEY ("resourceId", "targetId", "code")
);

CREATE INDEX IF NOT EXISTS "HumanName_resourceId_idx"
  ON "HumanName" USING btree ("resourceId");

CREATE INDEX IF NOT EXISTS "HumanName_name_idx"
  ON "HumanName" USING btree ("name");

CREATE INDEX IF NOT EXISTS "HumanName_given_idx"
  ON "HumanName" USING btree ("given");

CREATE INDEX IF NOT EXISTS "HumanName_family_idx"
  ON "HumanName" USING btree ("family");

CREATE INDEX IF NOT EXISTS "HumanName_nameTrgm_idx"
  ON "HumanName" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HumanName_givenTrgm_idx"
  ON "HumanName" USING gin ("given" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HumanName_familyTrgm_idx"
  ON "HumanName" USING gin ("family" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HumanName_name_idx_tsv"
  ON "HumanName" USING gin (to_tsvector('simple'::regconfig, name));

CREATE INDEX IF NOT EXISTS "HumanName_given_idx_tsv"
  ON "HumanName" USING gin (to_tsvector('simple'::regconfig, given));

CREATE INDEX IF NOT EXISTS "HumanName_family_idx_tsv"
  ON "HumanName" USING gin (to_tsvector('simple'::regconfig, family));

CREATE INDEX IF NOT EXISTS "Address_resourceId_idx"
  ON "Address" USING btree ("resourceId");

CREATE INDEX IF NOT EXISTS "Address_address_idx"
  ON "Address" USING btree ("address");

CREATE INDEX IF NOT EXISTS "Address_address_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, address));

CREATE INDEX IF NOT EXISTS "Address_city_idx"
  ON "Address" USING btree ("city");

CREATE INDEX IF NOT EXISTS "Address_city_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, city));

CREATE INDEX IF NOT EXISTS "Address_country_idx"
  ON "Address" USING btree ("country");

CREATE INDEX IF NOT EXISTS "Address_country_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, country));

CREATE INDEX IF NOT EXISTS "Address_postalCode_idx"
  ON "Address" USING btree ("postalCode");

CREATE INDEX IF NOT EXISTS "Address_postalCode_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, "postalCode"));

CREATE INDEX IF NOT EXISTS "Address_state_idx"
  ON "Address" USING btree ("state");

CREATE INDEX IF NOT EXISTS "Address_state_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, state));

CREATE INDEX IF NOT EXISTS "Address_use_idx"
  ON "Address" USING btree ("use");

CREATE INDEX IF NOT EXISTS "Address_use_idx_tsv"
  ON "Address" USING gin (to_tsvector('simple'::regconfig, use));

CREATE INDEX IF NOT EXISTS "ContactPoint_resourceId_idx"
  ON "ContactPoint" USING btree ("resourceId");

CREATE INDEX IF NOT EXISTS "ContactPoint_system_idx"
  ON "ContactPoint" USING btree ("system");

CREATE INDEX IF NOT EXISTS "ContactPoint_value_idx"
  ON "ContactPoint" USING btree ("value");

CREATE INDEX IF NOT EXISTS "Identifier_resourceId_idx"
  ON "Identifier" USING btree ("resourceId");

CREATE INDEX IF NOT EXISTS "Identifier_value_idx"
  ON "Identifier" USING btree ("value");

CREATE INDEX IF NOT EXISTS "Account_lastUpdated_idx"
  ON "Account" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Account_projectId_lastUpdated_idx"
  ON "Account" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Account_projectId_idx"
  ON "Account" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Account__source_idx"
  ON "Account" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Account_profile_idx"
  ON "Account" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Account___version_idx"
  ON "Account" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Account_reindex_idx"
  ON "Account" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Account_compartments_idx"
  ON "Account" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Account___identifier_idx"
  ON "Account" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Account___nameSort_idx"
  ON "Account" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Account_owner_idx"
  ON "Account" USING btree ("owner");

CREATE INDEX IF NOT EXISTS "Account_patient_idx"
  ON "Account" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "Account_period_idx"
  ON "Account" USING btree ("period");

CREATE INDEX IF NOT EXISTS "Account___status_idx"
  ON "Account" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Account_subject_idx"
  ON "Account" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "Account___type_idx"
  ON "Account" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Account___sharedTokens_idx"
  ON "Account" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Account___identifierText_trgm_idx"
  ON "Account" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Account___statusText_trgm_idx"
  ON "Account" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Account___typeText_trgm_idx"
  ON "Account" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Account____tagText_trgm_idx"
  ON "Account" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Account___sharedTokensText_trgm_idx"
  ON "Account" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Account_History_id_idx"
  ON "Account_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Account_History_lastUpdated_idx"
  ON "Account_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Account_References_targetId_code_idx"
  ON "Account_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_lastUpdated_idx"
  ON "ActivityDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_projectId_lastUpdated_idx"
  ON "ActivityDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_projectId_idx"
  ON "ActivityDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ActivityDefinition__source_idx"
  ON "ActivityDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_profile_idx"
  ON "ActivityDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___version_idx"
  ON "ActivityDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_reindex_idx"
  ON "ActivityDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ActivityDefinition_compartments_idx"
  ON "ActivityDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_composedOf_idx"
  ON "ActivityDefinition" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___context_idx"
  ON "ActivityDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_contextQuantity_idx"
  ON "ActivityDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___contextType_idx"
  ON "ActivityDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_date_idx"
  ON "ActivityDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_dependsOn_idx"
  ON "ActivityDefinition" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_derivedFrom_idx"
  ON "ActivityDefinition" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_description_idx"
  ON "ActivityDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_effective_idx"
  ON "ActivityDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___identifier_idx"
  ON "ActivityDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___jurisdiction_idx"
  ON "ActivityDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___nameSort_idx"
  ON "ActivityDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_predecessor_idx"
  ON "ActivityDefinition" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_publisher_idx"
  ON "ActivityDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___status_idx"
  ON "ActivityDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_successor_idx"
  ON "ActivityDefinition" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_title_idx"
  ON "ActivityDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___topic_idx"
  ON "ActivityDefinition" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_url_idx"
  ON "ActivityDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_version_idx"
  ON "ActivityDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___sharedTokens_idx"
  ON "ActivityDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ActivityDefinition___contextText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___contextTypeText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___identifierText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___jurisdictionText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___statusText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___topicText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition____tagText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition___sharedTokensText_trgm_idx"
  ON "ActivityDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ActivityDefinition_History_id_idx"
  ON "ActivityDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_History_lastUpdated_idx"
  ON "ActivityDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ActivityDefinition_References_targetId_code_idx"
  ON "ActivityDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "AdverseEvent_lastUpdated_idx"
  ON "AdverseEvent" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AdverseEvent_projectId_lastUpdated_idx"
  ON "AdverseEvent" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "AdverseEvent_projectId_idx"
  ON "AdverseEvent" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "AdverseEvent__source_idx"
  ON "AdverseEvent" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "AdverseEvent_profile_idx"
  ON "AdverseEvent" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "AdverseEvent___version_idx"
  ON "AdverseEvent" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "AdverseEvent_reindex_idx"
  ON "AdverseEvent" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "AdverseEvent_compartments_idx"
  ON "AdverseEvent" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "AdverseEvent___actuality_idx"
  ON "AdverseEvent" USING gin ("__actuality");

CREATE INDEX IF NOT EXISTS "AdverseEvent___category_idx"
  ON "AdverseEvent" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "AdverseEvent_date_idx"
  ON "AdverseEvent" USING btree ("date");

CREATE INDEX IF NOT EXISTS "AdverseEvent___event_idx"
  ON "AdverseEvent" USING gin ("__event");

CREATE INDEX IF NOT EXISTS "AdverseEvent_location_idx"
  ON "AdverseEvent" USING btree ("location");

CREATE INDEX IF NOT EXISTS "AdverseEvent_recorder_idx"
  ON "AdverseEvent" USING btree ("recorder");

CREATE INDEX IF NOT EXISTS "AdverseEvent_resultingcondition_idx"
  ON "AdverseEvent" USING gin ("resultingcondition");

CREATE INDEX IF NOT EXISTS "AdverseEvent___seriousness_idx"
  ON "AdverseEvent" USING gin ("__seriousness");

CREATE INDEX IF NOT EXISTS "AdverseEvent___severity_idx"
  ON "AdverseEvent" USING gin ("__severity");

CREATE INDEX IF NOT EXISTS "AdverseEvent_study_idx"
  ON "AdverseEvent" USING gin ("study");

CREATE INDEX IF NOT EXISTS "AdverseEvent_subject_idx"
  ON "AdverseEvent" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "AdverseEvent_substance_idx"
  ON "AdverseEvent" USING gin ("substance");

CREATE INDEX IF NOT EXISTS "AdverseEvent___sharedTokens_idx"
  ON "AdverseEvent" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "AdverseEvent___actualityText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__actualityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent___categoryText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent___eventText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__eventText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent___seriousnessText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__seriousnessText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent___severityText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__severityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent____tagText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent___sharedTokensText_trgm_idx"
  ON "AdverseEvent" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AdverseEvent_History_id_idx"
  ON "AdverseEvent_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "AdverseEvent_History_lastUpdated_idx"
  ON "AdverseEvent_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AdverseEvent_References_targetId_code_idx"
  ON "AdverseEvent_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_lastUpdated_idx"
  ON "AllergyIntolerance" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_projectId_lastUpdated_idx"
  ON "AllergyIntolerance" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_projectId_idx"
  ON "AllergyIntolerance" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance__source_idx"
  ON "AllergyIntolerance" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_profile_idx"
  ON "AllergyIntolerance" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___version_idx"
  ON "AllergyIntolerance" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_reindex_idx"
  ON "AllergyIntolerance" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_compartments_idx"
  ON "AllergyIntolerance" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_asserter_idx"
  ON "AllergyIntolerance" USING btree ("asserter");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___category_idx"
  ON "AllergyIntolerance" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___clinicalStatus_idx"
  ON "AllergyIntolerance" USING gin ("__clinicalStatus");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___code_idx"
  ON "AllergyIntolerance" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___criticality_idx"
  ON "AllergyIntolerance" USING gin ("__criticality");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_date_idx"
  ON "AllergyIntolerance" USING btree ("date");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___identifier_idx"
  ON "AllergyIntolerance" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_lastDate_idx"
  ON "AllergyIntolerance" USING btree ("lastDate");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___manifestation_idx"
  ON "AllergyIntolerance" USING gin ("__manifestation");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_onset_idx"
  ON "AllergyIntolerance" USING gin ("onset");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_patient_idx"
  ON "AllergyIntolerance" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_recorder_idx"
  ON "AllergyIntolerance" USING btree ("recorder");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___route_idx"
  ON "AllergyIntolerance" USING gin ("__route");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___severity_idx"
  ON "AllergyIntolerance" USING gin ("__severity");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___type_idx"
  ON "AllergyIntolerance" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___verificationStatus_idx"
  ON "AllergyIntolerance" USING gin ("__verificationStatus");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___sharedTokens_idx"
  ON "AllergyIntolerance" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___categoryText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___clinicalStatusText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__clinicalStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___codeText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___criticalityText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__criticalityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___identifierText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___manifestationText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__manifestationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___routeText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__routeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___severityText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__severityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___typeText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___verificationStatusText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__verificationStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance____tagText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance___sharedTokensText_trgm_idx"
  ON "AllergyIntolerance" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_History_id_idx"
  ON "AllergyIntolerance_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_History_lastUpdated_idx"
  ON "AllergyIntolerance_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AllergyIntolerance_References_targetId_code_idx"
  ON "AllergyIntolerance_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Appointment_lastUpdated_idx"
  ON "Appointment" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Appointment_projectId_lastUpdated_idx"
  ON "Appointment" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Appointment_projectId_idx"
  ON "Appointment" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Appointment__source_idx"
  ON "Appointment" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Appointment_profile_idx"
  ON "Appointment" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Appointment___version_idx"
  ON "Appointment" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Appointment_reindex_idx"
  ON "Appointment" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Appointment_compartments_idx"
  ON "Appointment" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Appointment_actor_idx"
  ON "Appointment" USING gin ("actor");

CREATE INDEX IF NOT EXISTS "Appointment___appointmentType_idx"
  ON "Appointment" USING gin ("__appointmentType");

CREATE INDEX IF NOT EXISTS "Appointment_basedOn_idx"
  ON "Appointment" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Appointment_date_idx"
  ON "Appointment" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Appointment___identifier_idx"
  ON "Appointment" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Appointment_location_idx"
  ON "Appointment" USING gin ("location");

CREATE INDEX IF NOT EXISTS "Appointment___partStatus_idx"
  ON "Appointment" USING gin ("__partStatus");

CREATE INDEX IF NOT EXISTS "Appointment_patient_idx"
  ON "Appointment" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "Appointment_practitioner_idx"
  ON "Appointment" USING gin ("practitioner");

CREATE INDEX IF NOT EXISTS "Appointment___reasonCode_idx"
  ON "Appointment" USING gin ("__reasonCode");

CREATE INDEX IF NOT EXISTS "Appointment_reasonReference_idx"
  ON "Appointment" USING gin ("reasonReference");

CREATE INDEX IF NOT EXISTS "Appointment___serviceCategory_idx"
  ON "Appointment" USING gin ("__serviceCategory");

CREATE INDEX IF NOT EXISTS "Appointment___serviceType_idx"
  ON "Appointment" USING gin ("__serviceType");

CREATE INDEX IF NOT EXISTS "Appointment_slot_idx"
  ON "Appointment" USING gin ("slot");

CREATE INDEX IF NOT EXISTS "Appointment___specialty_idx"
  ON "Appointment" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "Appointment___status_idx"
  ON "Appointment" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Appointment_supportingInfo_idx"
  ON "Appointment" USING gin ("supportingInfo");

CREATE INDEX IF NOT EXISTS "Appointment___sharedTokens_idx"
  ON "Appointment" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Appointment___appointmentTypeText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__appointmentTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___identifierText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___partStatusText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__partStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___reasonCodeText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__reasonCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___serviceCategoryText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__serviceCategoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___serviceTypeText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__serviceTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___specialtyText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___statusText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment____tagText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment___sharedTokensText_trgm_idx"
  ON "Appointment" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Appointment_History_id_idx"
  ON "Appointment_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Appointment_History_lastUpdated_idx"
  ON "Appointment_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Appointment_References_targetId_code_idx"
  ON "Appointment_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_lastUpdated_idx"
  ON "AppointmentResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_projectId_lastUpdated_idx"
  ON "AppointmentResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_projectId_idx"
  ON "AppointmentResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "AppointmentResponse__source_idx"
  ON "AppointmentResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_profile_idx"
  ON "AppointmentResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "AppointmentResponse___version_idx"
  ON "AppointmentResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_reindex_idx"
  ON "AppointmentResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "AppointmentResponse_compartments_idx"
  ON "AppointmentResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_actor_idx"
  ON "AppointmentResponse" USING btree ("actor");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_appointment_idx"
  ON "AppointmentResponse" USING btree ("appointment");

CREATE INDEX IF NOT EXISTS "AppointmentResponse___identifier_idx"
  ON "AppointmentResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_location_idx"
  ON "AppointmentResponse" USING btree ("location");

CREATE INDEX IF NOT EXISTS "AppointmentResponse___partStatus_idx"
  ON "AppointmentResponse" USING gin ("__partStatus");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_patient_idx"
  ON "AppointmentResponse" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_practitioner_idx"
  ON "AppointmentResponse" USING btree ("practitioner");

CREATE INDEX IF NOT EXISTS "AppointmentResponse___sharedTokens_idx"
  ON "AppointmentResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "AppointmentResponse___identifierText_trgm_idx"
  ON "AppointmentResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AppointmentResponse___partStatusText_trgm_idx"
  ON "AppointmentResponse" USING gin (token_array_to_text("__partStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AppointmentResponse____tagText_trgm_idx"
  ON "AppointmentResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AppointmentResponse___sharedTokensText_trgm_idx"
  ON "AppointmentResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AppointmentResponse_History_id_idx"
  ON "AppointmentResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_History_lastUpdated_idx"
  ON "AppointmentResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AppointmentResponse_References_targetId_code_idx"
  ON "AppointmentResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "AuditEvent_lastUpdated_idx"
  ON "AuditEvent" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AuditEvent_projectId_lastUpdated_idx"
  ON "AuditEvent" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "AuditEvent_projectId_idx"
  ON "AuditEvent" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "AuditEvent__source_idx"
  ON "AuditEvent" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "AuditEvent_profile_idx"
  ON "AuditEvent" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "AuditEvent___version_idx"
  ON "AuditEvent" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "AuditEvent_reindex_idx"
  ON "AuditEvent" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "AuditEvent_compartments_idx"
  ON "AuditEvent" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "AuditEvent___action_idx"
  ON "AuditEvent" USING gin ("__action");

CREATE INDEX IF NOT EXISTS "AuditEvent___addressSort_idx"
  ON "AuditEvent" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "AuditEvent_agent_idx"
  ON "AuditEvent" USING gin ("agent");

CREATE INDEX IF NOT EXISTS "AuditEvent_agentName_idx"
  ON "AuditEvent" USING gin ("agentName");

CREATE INDEX IF NOT EXISTS "AuditEvent___agentRole_idx"
  ON "AuditEvent" USING gin ("__agentRole");

CREATE INDEX IF NOT EXISTS "AuditEvent___altid_idx"
  ON "AuditEvent" USING gin ("__altid");

CREATE INDEX IF NOT EXISTS "AuditEvent_date_idx"
  ON "AuditEvent" USING btree ("date");

CREATE INDEX IF NOT EXISTS "AuditEvent_entity_idx"
  ON "AuditEvent" USING gin ("entity");

CREATE INDEX IF NOT EXISTS "AuditEvent_entityName_idx"
  ON "AuditEvent" USING gin ("entityName");

CREATE INDEX IF NOT EXISTS "AuditEvent___entityRole_idx"
  ON "AuditEvent" USING gin ("__entityRole");

CREATE INDEX IF NOT EXISTS "AuditEvent___entityType_idx"
  ON "AuditEvent" USING gin ("__entityType");

CREATE INDEX IF NOT EXISTS "AuditEvent___outcome_idx"
  ON "AuditEvent" USING gin ("__outcome");

CREATE INDEX IF NOT EXISTS "AuditEvent_patient_idx"
  ON "AuditEvent" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "AuditEvent_policy_idx"
  ON "AuditEvent" USING gin ("policy");

CREATE INDEX IF NOT EXISTS "AuditEvent___site_idx"
  ON "AuditEvent" USING gin ("__site");

CREATE INDEX IF NOT EXISTS "AuditEvent_source_idx"
  ON "AuditEvent" USING btree ("source");

CREATE INDEX IF NOT EXISTS "AuditEvent___subtype_idx"
  ON "AuditEvent" USING gin ("__subtype");

CREATE INDEX IF NOT EXISTS "AuditEvent___type_idx"
  ON "AuditEvent" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "AuditEvent___sharedTokens_idx"
  ON "AuditEvent" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "AuditEvent___actionText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__actionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___agentRoleText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__agentRoleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___altidText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__altidText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___entityRoleText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__entityRoleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___entityTypeText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__entityTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___outcomeText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__outcomeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___siteText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__siteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___subtypeText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__subtypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___typeText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent____tagText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent___sharedTokensText_trgm_idx"
  ON "AuditEvent" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "AuditEvent_History_id_idx"
  ON "AuditEvent_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "AuditEvent_History_lastUpdated_idx"
  ON "AuditEvent_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "AuditEvent_References_targetId_code_idx"
  ON "AuditEvent_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Basic_lastUpdated_idx"
  ON "Basic" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Basic_projectId_lastUpdated_idx"
  ON "Basic" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Basic_projectId_idx"
  ON "Basic" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Basic__source_idx"
  ON "Basic" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Basic_profile_idx"
  ON "Basic" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Basic___version_idx"
  ON "Basic" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Basic_reindex_idx"
  ON "Basic" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Basic_compartments_idx"
  ON "Basic" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Basic_author_idx"
  ON "Basic" USING btree ("author");

CREATE INDEX IF NOT EXISTS "Basic___code_idx"
  ON "Basic" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Basic_created_idx"
  ON "Basic" USING btree ("created");

CREATE INDEX IF NOT EXISTS "Basic___identifier_idx"
  ON "Basic" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Basic_patient_idx"
  ON "Basic" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Basic_subject_idx"
  ON "Basic" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Basic___sharedTokens_idx"
  ON "Basic" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Basic___codeText_trgm_idx"
  ON "Basic" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Basic___identifierText_trgm_idx"
  ON "Basic" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Basic____tagText_trgm_idx"
  ON "Basic" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Basic___sharedTokensText_trgm_idx"
  ON "Basic" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Basic_History_id_idx"
  ON "Basic_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Basic_History_lastUpdated_idx"
  ON "Basic_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Basic_References_targetId_code_idx"
  ON "Basic_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Binary_lastUpdated_idx"
  ON "Binary" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Binary_projectId_lastUpdated_idx"
  ON "Binary" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Binary_projectId_idx"
  ON "Binary" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Binary__source_idx"
  ON "Binary" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Binary_profile_idx"
  ON "Binary" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Binary___version_idx"
  ON "Binary" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Binary_reindex_idx"
  ON "Binary" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Binary___sharedTokens_idx"
  ON "Binary" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Binary____tagText_trgm_idx"
  ON "Binary" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Binary___sharedTokensText_trgm_idx"
  ON "Binary" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Binary_History_id_idx"
  ON "Binary_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Binary_History_lastUpdated_idx"
  ON "Binary_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Binary_References_targetId_code_idx"
  ON "Binary_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_lastUpdated_idx"
  ON "BiologicallyDerivedProduct" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_projectId_lastUpdated_idx"
  ON "BiologicallyDerivedProduct" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_projectId_idx"
  ON "BiologicallyDerivedProduct" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct__source_idx"
  ON "BiologicallyDerivedProduct" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_profile_idx"
  ON "BiologicallyDerivedProduct" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct___version_idx"
  ON "BiologicallyDerivedProduct" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_reindex_idx"
  ON "BiologicallyDerivedProduct" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_compartments_idx"
  ON "BiologicallyDerivedProduct" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct___sharedTokens_idx"
  ON "BiologicallyDerivedProduct" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct____tagText_trgm_idx"
  ON "BiologicallyDerivedProduct" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct___sharedTokensText_trgm_idx"
  ON "BiologicallyDerivedProduct" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_History_id_idx"
  ON "BiologicallyDerivedProduct_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_History_lastUpdated_idx"
  ON "BiologicallyDerivedProduct_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "BiologicallyDerivedProduct_References_targetId_code_idx"
  ON "BiologicallyDerivedProduct_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "BodyStructure_lastUpdated_idx"
  ON "BodyStructure" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "BodyStructure_projectId_lastUpdated_idx"
  ON "BodyStructure" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "BodyStructure_projectId_idx"
  ON "BodyStructure" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "BodyStructure__source_idx"
  ON "BodyStructure" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "BodyStructure_profile_idx"
  ON "BodyStructure" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "BodyStructure___version_idx"
  ON "BodyStructure" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "BodyStructure_reindex_idx"
  ON "BodyStructure" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "BodyStructure_compartments_idx"
  ON "BodyStructure" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "BodyStructure___identifier_idx"
  ON "BodyStructure" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "BodyStructure___location_idx"
  ON "BodyStructure" USING gin ("__location");

CREATE INDEX IF NOT EXISTS "BodyStructure___morphology_idx"
  ON "BodyStructure" USING gin ("__morphology");

CREATE INDEX IF NOT EXISTS "BodyStructure_patient_idx"
  ON "BodyStructure" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "BodyStructure___sharedTokens_idx"
  ON "BodyStructure" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "BodyStructure___identifierText_trgm_idx"
  ON "BodyStructure" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BodyStructure___locationText_trgm_idx"
  ON "BodyStructure" USING gin (token_array_to_text("__locationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BodyStructure___morphologyText_trgm_idx"
  ON "BodyStructure" USING gin (token_array_to_text("__morphologyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BodyStructure____tagText_trgm_idx"
  ON "BodyStructure" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BodyStructure___sharedTokensText_trgm_idx"
  ON "BodyStructure" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "BodyStructure_History_id_idx"
  ON "BodyStructure_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "BodyStructure_History_lastUpdated_idx"
  ON "BodyStructure_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "BodyStructure_References_targetId_code_idx"
  ON "BodyStructure_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Bundle_lastUpdated_idx"
  ON "Bundle" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Bundle_projectId_lastUpdated_idx"
  ON "Bundle" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Bundle_projectId_idx"
  ON "Bundle" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Bundle__source_idx"
  ON "Bundle" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Bundle_profile_idx"
  ON "Bundle" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Bundle___version_idx"
  ON "Bundle" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Bundle_reindex_idx"
  ON "Bundle" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Bundle_compartments_idx"
  ON "Bundle" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Bundle_composition_idx"
  ON "Bundle" USING btree ("composition");

CREATE INDEX IF NOT EXISTS "Bundle___identifier_idx"
  ON "Bundle" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Bundle_message_idx"
  ON "Bundle" USING btree ("message");

CREATE INDEX IF NOT EXISTS "Bundle_timestamp_idx"
  ON "Bundle" USING btree ("timestamp");

CREATE INDEX IF NOT EXISTS "Bundle___type_idx"
  ON "Bundle" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Bundle___sharedTokens_idx"
  ON "Bundle" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Bundle___identifierText_trgm_idx"
  ON "Bundle" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Bundle___typeText_trgm_idx"
  ON "Bundle" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Bundle____tagText_trgm_idx"
  ON "Bundle" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Bundle___sharedTokensText_trgm_idx"
  ON "Bundle" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Bundle_History_id_idx"
  ON "Bundle_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Bundle_History_lastUpdated_idx"
  ON "Bundle_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Bundle_References_targetId_code_idx"
  ON "Bundle_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_lastUpdated_idx"
  ON "CapabilityStatement" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_projectId_lastUpdated_idx"
  ON "CapabilityStatement" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_projectId_idx"
  ON "CapabilityStatement" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CapabilityStatement__source_idx"
  ON "CapabilityStatement" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_profile_idx"
  ON "CapabilityStatement" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___version_idx"
  ON "CapabilityStatement" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_reindex_idx"
  ON "CapabilityStatement" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CapabilityStatement_compartments_idx"
  ON "CapabilityStatement" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___context_idx"
  ON "CapabilityStatement" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_contextQuantity_idx"
  ON "CapabilityStatement" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___contextType_idx"
  ON "CapabilityStatement" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_date_idx"
  ON "CapabilityStatement" USING btree ("date");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_description_idx"
  ON "CapabilityStatement" USING btree ("description");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___fhirversion_idx"
  ON "CapabilityStatement" USING gin ("__fhirversion");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___format_idx"
  ON "CapabilityStatement" USING gin ("__format");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_guide_idx"
  ON "CapabilityStatement" USING gin ("guide");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___jurisdiction_idx"
  ON "CapabilityStatement" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___mode_idx"
  ON "CapabilityStatement" USING gin ("__mode");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___nameSort_idx"
  ON "CapabilityStatement" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_publisher_idx"
  ON "CapabilityStatement" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___resource_idx"
  ON "CapabilityStatement" USING gin ("__resource");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_resourceProfile_idx"
  ON "CapabilityStatement" USING gin ("resourceProfile");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___securityService_idx"
  ON "CapabilityStatement" USING gin ("__securityService");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_software_idx"
  ON "CapabilityStatement" USING btree ("software");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___status_idx"
  ON "CapabilityStatement" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_supportedProfile_idx"
  ON "CapabilityStatement" USING gin ("supportedProfile");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_title_idx"
  ON "CapabilityStatement" USING btree ("title");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_url_idx"
  ON "CapabilityStatement" USING btree ("url");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_version_idx"
  ON "CapabilityStatement" USING btree ("version");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___sharedTokens_idx"
  ON "CapabilityStatement" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CapabilityStatement___contextText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___contextTypeText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___fhirversionText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__fhirversionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___formatText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__formatText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___jurisdictionText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___modeText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__modeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___resourceText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__resourceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___securityServiceText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__securityServiceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___statusText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement____tagText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement___sharedTokensText_trgm_idx"
  ON "CapabilityStatement" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CapabilityStatement_History_id_idx"
  ON "CapabilityStatement_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_History_lastUpdated_idx"
  ON "CapabilityStatement_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CapabilityStatement_References_targetId_code_idx"
  ON "CapabilityStatement_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CarePlan_lastUpdated_idx"
  ON "CarePlan" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CarePlan_projectId_lastUpdated_idx"
  ON "CarePlan" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CarePlan_projectId_idx"
  ON "CarePlan" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CarePlan__source_idx"
  ON "CarePlan" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CarePlan_profile_idx"
  ON "CarePlan" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CarePlan___version_idx"
  ON "CarePlan" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CarePlan_reindex_idx"
  ON "CarePlan" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CarePlan_compartments_idx"
  ON "CarePlan" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CarePlan___activityCode_idx"
  ON "CarePlan" USING gin ("__activityCode");

CREATE INDEX IF NOT EXISTS "CarePlan_activityDate_idx"
  ON "CarePlan" USING gin ("activityDate");

CREATE INDEX IF NOT EXISTS "CarePlan_activityReference_idx"
  ON "CarePlan" USING gin ("activityReference");

CREATE INDEX IF NOT EXISTS "CarePlan_basedOn_idx"
  ON "CarePlan" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "CarePlan_careTeam_idx"
  ON "CarePlan" USING gin ("careTeam");

CREATE INDEX IF NOT EXISTS "CarePlan___category_idx"
  ON "CarePlan" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "CarePlan_condition_idx"
  ON "CarePlan" USING gin ("condition");

CREATE INDEX IF NOT EXISTS "CarePlan_date_idx"
  ON "CarePlan" USING btree ("date");

CREATE INDEX IF NOT EXISTS "CarePlan_encounter_idx"
  ON "CarePlan" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "CarePlan_goal_idx"
  ON "CarePlan" USING gin ("goal");

CREATE INDEX IF NOT EXISTS "CarePlan___identifier_idx"
  ON "CarePlan" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CarePlan_instantiatesCanonical_idx"
  ON "CarePlan" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "CarePlan_instantiatesUri_idx"
  ON "CarePlan" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "CarePlan___intent_idx"
  ON "CarePlan" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "CarePlan_partOf_idx"
  ON "CarePlan" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "CarePlan_patient_idx"
  ON "CarePlan" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "CarePlan_performer_idx"
  ON "CarePlan" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "CarePlan_replaces_idx"
  ON "CarePlan" USING gin ("replaces");

CREATE INDEX IF NOT EXISTS "CarePlan___status_idx"
  ON "CarePlan" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CarePlan_subject_idx"
  ON "CarePlan" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "CarePlan___sharedTokens_idx"
  ON "CarePlan" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CarePlan___activityCodeText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__activityCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan___categoryText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan___identifierText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan___intentText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan___statusText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan____tagText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan___sharedTokensText_trgm_idx"
  ON "CarePlan" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CarePlan_History_id_idx"
  ON "CarePlan_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CarePlan_History_lastUpdated_idx"
  ON "CarePlan_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CarePlan_References_targetId_code_idx"
  ON "CarePlan_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CareTeam_lastUpdated_idx"
  ON "CareTeam" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CareTeam_projectId_lastUpdated_idx"
  ON "CareTeam" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CareTeam_projectId_idx"
  ON "CareTeam" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CareTeam__source_idx"
  ON "CareTeam" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CareTeam_profile_idx"
  ON "CareTeam" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CareTeam___version_idx"
  ON "CareTeam" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CareTeam_reindex_idx"
  ON "CareTeam" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CareTeam_compartments_idx"
  ON "CareTeam" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CareTeam___category_idx"
  ON "CareTeam" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "CareTeam_date_idx"
  ON "CareTeam" USING btree ("date");

CREATE INDEX IF NOT EXISTS "CareTeam_encounter_idx"
  ON "CareTeam" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "CareTeam___identifier_idx"
  ON "CareTeam" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CareTeam_participant_idx"
  ON "CareTeam" USING gin ("participant");

CREATE INDEX IF NOT EXISTS "CareTeam_patient_idx"
  ON "CareTeam" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "CareTeam___status_idx"
  ON "CareTeam" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CareTeam_subject_idx"
  ON "CareTeam" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "CareTeam___sharedTokens_idx"
  ON "CareTeam" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CareTeam___categoryText_trgm_idx"
  ON "CareTeam" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CareTeam___identifierText_trgm_idx"
  ON "CareTeam" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CareTeam___statusText_trgm_idx"
  ON "CareTeam" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CareTeam____tagText_trgm_idx"
  ON "CareTeam" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CareTeam___sharedTokensText_trgm_idx"
  ON "CareTeam" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CareTeam_History_id_idx"
  ON "CareTeam_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CareTeam_History_lastUpdated_idx"
  ON "CareTeam_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CareTeam_References_targetId_code_idx"
  ON "CareTeam_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CatalogEntry_lastUpdated_idx"
  ON "CatalogEntry" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CatalogEntry_projectId_lastUpdated_idx"
  ON "CatalogEntry" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CatalogEntry_projectId_idx"
  ON "CatalogEntry" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CatalogEntry__source_idx"
  ON "CatalogEntry" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CatalogEntry_profile_idx"
  ON "CatalogEntry" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CatalogEntry___version_idx"
  ON "CatalogEntry" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CatalogEntry_reindex_idx"
  ON "CatalogEntry" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CatalogEntry_compartments_idx"
  ON "CatalogEntry" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CatalogEntry___sharedTokens_idx"
  ON "CatalogEntry" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CatalogEntry____tagText_trgm_idx"
  ON "CatalogEntry" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CatalogEntry___sharedTokensText_trgm_idx"
  ON "CatalogEntry" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CatalogEntry_History_id_idx"
  ON "CatalogEntry_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CatalogEntry_History_lastUpdated_idx"
  ON "CatalogEntry_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CatalogEntry_References_targetId_code_idx"
  ON "CatalogEntry_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ChargeItem_lastUpdated_idx"
  ON "ChargeItem" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItem_projectId_lastUpdated_idx"
  ON "ChargeItem" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItem_projectId_idx"
  ON "ChargeItem" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ChargeItem__source_idx"
  ON "ChargeItem" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ChargeItem_profile_idx"
  ON "ChargeItem" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ChargeItem___version_idx"
  ON "ChargeItem" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ChargeItem_reindex_idx"
  ON "ChargeItem" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ChargeItem_compartments_idx"
  ON "ChargeItem" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ChargeItem_account_idx"
  ON "ChargeItem" USING gin ("account");

CREATE INDEX IF NOT EXISTS "ChargeItem___code_idx"
  ON "ChargeItem" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "ChargeItem_context_idx"
  ON "ChargeItem" USING btree ("context");

CREATE INDEX IF NOT EXISTS "ChargeItem_enteredDate_idx"
  ON "ChargeItem" USING btree ("enteredDate");

CREATE INDEX IF NOT EXISTS "ChargeItem_enterer_idx"
  ON "ChargeItem" USING btree ("enterer");

CREATE INDEX IF NOT EXISTS "ChargeItem_factorOverride_idx"
  ON "ChargeItem" USING btree ("factorOverride");

CREATE INDEX IF NOT EXISTS "ChargeItem___identifier_idx"
  ON "ChargeItem" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ChargeItem_occurrence_idx"
  ON "ChargeItem" USING btree ("occurrence");

CREATE INDEX IF NOT EXISTS "ChargeItem_patient_idx"
  ON "ChargeItem" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ChargeItem_performerActor_idx"
  ON "ChargeItem" USING gin ("performerActor");

CREATE INDEX IF NOT EXISTS "ChargeItem___performerFunction_idx"
  ON "ChargeItem" USING gin ("__performerFunction");

CREATE INDEX IF NOT EXISTS "ChargeItem_performingOrganization_idx"
  ON "ChargeItem" USING btree ("performingOrganization");

CREATE INDEX IF NOT EXISTS "ChargeItem_priceOverride_idx"
  ON "ChargeItem" USING btree ("priceOverride");

CREATE INDEX IF NOT EXISTS "ChargeItem_quantity_idx"
  ON "ChargeItem" USING btree ("quantity");

CREATE INDEX IF NOT EXISTS "ChargeItem_requestingOrganization_idx"
  ON "ChargeItem" USING btree ("requestingOrganization");

CREATE INDEX IF NOT EXISTS "ChargeItem_service_idx"
  ON "ChargeItem" USING gin ("service");

CREATE INDEX IF NOT EXISTS "ChargeItem_subject_idx"
  ON "ChargeItem" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "ChargeItem___sharedTokens_idx"
  ON "ChargeItem" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ChargeItem___codeText_trgm_idx"
  ON "ChargeItem" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItem___identifierText_trgm_idx"
  ON "ChargeItem" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItem___performerFunctionText_trgm_idx"
  ON "ChargeItem" USING gin (token_array_to_text("__performerFunctionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItem____tagText_trgm_idx"
  ON "ChargeItem" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItem___sharedTokensText_trgm_idx"
  ON "ChargeItem" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItem_History_id_idx"
  ON "ChargeItem_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ChargeItem_History_lastUpdated_idx"
  ON "ChargeItem_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItem_References_targetId_code_idx"
  ON "ChargeItem_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_lastUpdated_idx"
  ON "ChargeItemDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_projectId_lastUpdated_idx"
  ON "ChargeItemDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_projectId_idx"
  ON "ChargeItemDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition__source_idx"
  ON "ChargeItemDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_profile_idx"
  ON "ChargeItemDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___version_idx"
  ON "ChargeItemDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_reindex_idx"
  ON "ChargeItemDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_compartments_idx"
  ON "ChargeItemDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___context_idx"
  ON "ChargeItemDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_contextQuantity_idx"
  ON "ChargeItemDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___contextType_idx"
  ON "ChargeItemDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_date_idx"
  ON "ChargeItemDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_description_idx"
  ON "ChargeItemDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_effective_idx"
  ON "ChargeItemDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___identifier_idx"
  ON "ChargeItemDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___jurisdiction_idx"
  ON "ChargeItemDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_publisher_idx"
  ON "ChargeItemDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___status_idx"
  ON "ChargeItemDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_title_idx"
  ON "ChargeItemDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_url_idx"
  ON "ChargeItemDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_version_idx"
  ON "ChargeItemDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___sharedTokens_idx"
  ON "ChargeItemDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___contextText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___contextTypeText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___identifierText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___jurisdictionText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___statusText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition____tagText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition___sharedTokensText_trgm_idx"
  ON "ChargeItemDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_History_id_idx"
  ON "ChargeItemDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_History_lastUpdated_idx"
  ON "ChargeItemDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ChargeItemDefinition_References_targetId_code_idx"
  ON "ChargeItemDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Claim_lastUpdated_idx"
  ON "Claim" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Claim_projectId_lastUpdated_idx"
  ON "Claim" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Claim_projectId_idx"
  ON "Claim" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Claim__source_idx"
  ON "Claim" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Claim_profile_idx"
  ON "Claim" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Claim___version_idx"
  ON "Claim" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Claim_reindex_idx"
  ON "Claim" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Claim_compartments_idx"
  ON "Claim" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Claim_careTeam_idx"
  ON "Claim" USING gin ("careTeam");

CREATE INDEX IF NOT EXISTS "Claim_created_idx"
  ON "Claim" USING btree ("created");

CREATE INDEX IF NOT EXISTS "Claim_detailUdi_idx"
  ON "Claim" USING gin ("detailUdi");

CREATE INDEX IF NOT EXISTS "Claim_encounter_idx"
  ON "Claim" USING gin ("encounter");

CREATE INDEX IF NOT EXISTS "Claim_enterer_idx"
  ON "Claim" USING btree ("enterer");

CREATE INDEX IF NOT EXISTS "Claim_facility_idx"
  ON "Claim" USING btree ("facility");

CREATE INDEX IF NOT EXISTS "Claim___identifier_idx"
  ON "Claim" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Claim_insurer_idx"
  ON "Claim" USING btree ("insurer");

CREATE INDEX IF NOT EXISTS "Claim_itemUdi_idx"
  ON "Claim" USING gin ("itemUdi");

CREATE INDEX IF NOT EXISTS "Claim_patient_idx"
  ON "Claim" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Claim_payee_idx"
  ON "Claim" USING btree ("payee");

CREATE INDEX IF NOT EXISTS "Claim___priority_idx"
  ON "Claim" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "Claim_procedureUdi_idx"
  ON "Claim" USING gin ("procedureUdi");

CREATE INDEX IF NOT EXISTS "Claim_provider_idx"
  ON "Claim" USING btree ("provider");

CREATE INDEX IF NOT EXISTS "Claim___status_idx"
  ON "Claim" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Claim_subdetailUdi_idx"
  ON "Claim" USING gin ("subdetailUdi");

CREATE INDEX IF NOT EXISTS "Claim___use_idx"
  ON "Claim" USING gin ("__use");

CREATE INDEX IF NOT EXISTS "Claim___sharedTokens_idx"
  ON "Claim" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Claim___identifierText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim___priorityText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim___statusText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim___useText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("__useText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim____tagText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim___sharedTokensText_trgm_idx"
  ON "Claim" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Claim_History_id_idx"
  ON "Claim_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Claim_History_lastUpdated_idx"
  ON "Claim_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Claim_References_targetId_code_idx"
  ON "Claim_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ClaimResponse_lastUpdated_idx"
  ON "ClaimResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ClaimResponse_projectId_lastUpdated_idx"
  ON "ClaimResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ClaimResponse_projectId_idx"
  ON "ClaimResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ClaimResponse__source_idx"
  ON "ClaimResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ClaimResponse_profile_idx"
  ON "ClaimResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ClaimResponse___version_idx"
  ON "ClaimResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ClaimResponse_reindex_idx"
  ON "ClaimResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ClaimResponse_compartments_idx"
  ON "ClaimResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ClaimResponse_created_idx"
  ON "ClaimResponse" USING btree ("created");

CREATE INDEX IF NOT EXISTS "ClaimResponse_disposition_idx"
  ON "ClaimResponse" USING btree ("disposition");

CREATE INDEX IF NOT EXISTS "ClaimResponse___identifier_idx"
  ON "ClaimResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ClaimResponse_insurer_idx"
  ON "ClaimResponse" USING btree ("insurer");

CREATE INDEX IF NOT EXISTS "ClaimResponse___outcome_idx"
  ON "ClaimResponse" USING gin ("__outcome");

CREATE INDEX IF NOT EXISTS "ClaimResponse_patient_idx"
  ON "ClaimResponse" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ClaimResponse_paymentDate_idx"
  ON "ClaimResponse" USING btree ("paymentDate");

CREATE INDEX IF NOT EXISTS "ClaimResponse_request_idx"
  ON "ClaimResponse" USING btree ("request");

CREATE INDEX IF NOT EXISTS "ClaimResponse_requestor_idx"
  ON "ClaimResponse" USING btree ("requestor");

CREATE INDEX IF NOT EXISTS "ClaimResponse___status_idx"
  ON "ClaimResponse" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ClaimResponse___use_idx"
  ON "ClaimResponse" USING gin ("__use");

CREATE INDEX IF NOT EXISTS "ClaimResponse___sharedTokens_idx"
  ON "ClaimResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ClaimResponse___identifierText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse___outcomeText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("__outcomeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse___statusText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse___useText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("__useText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse____tagText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse___sharedTokensText_trgm_idx"
  ON "ClaimResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClaimResponse_History_id_idx"
  ON "ClaimResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ClaimResponse_History_lastUpdated_idx"
  ON "ClaimResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ClaimResponse_References_targetId_code_idx"
  ON "ClaimResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_lastUpdated_idx"
  ON "ClinicalImpression" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_projectId_lastUpdated_idx"
  ON "ClinicalImpression" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_projectId_idx"
  ON "ClinicalImpression" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ClinicalImpression__source_idx"
  ON "ClinicalImpression" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_profile_idx"
  ON "ClinicalImpression" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___version_idx"
  ON "ClinicalImpression" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_reindex_idx"
  ON "ClinicalImpression" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ClinicalImpression_compartments_idx"
  ON "ClinicalImpression" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_assessor_idx"
  ON "ClinicalImpression" USING btree ("assessor");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_date_idx"
  ON "ClinicalImpression" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_encounter_idx"
  ON "ClinicalImpression" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___findingCode_idx"
  ON "ClinicalImpression" USING gin ("__findingCode");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_findingRef_idx"
  ON "ClinicalImpression" USING gin ("findingRef");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___identifier_idx"
  ON "ClinicalImpression" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_investigation_idx"
  ON "ClinicalImpression" USING gin ("investigation");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_patient_idx"
  ON "ClinicalImpression" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_previous_idx"
  ON "ClinicalImpression" USING btree ("previous");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_problem_idx"
  ON "ClinicalImpression" USING gin ("problem");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___status_idx"
  ON "ClinicalImpression" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_subject_idx"
  ON "ClinicalImpression" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_supportingInfo_idx"
  ON "ClinicalImpression" USING gin ("supportingInfo");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___sharedTokens_idx"
  ON "ClinicalImpression" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ClinicalImpression___findingCodeText_trgm_idx"
  ON "ClinicalImpression" USING gin (token_array_to_text("__findingCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClinicalImpression___identifierText_trgm_idx"
  ON "ClinicalImpression" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClinicalImpression___statusText_trgm_idx"
  ON "ClinicalImpression" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClinicalImpression____tagText_trgm_idx"
  ON "ClinicalImpression" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClinicalImpression___sharedTokensText_trgm_idx"
  ON "ClinicalImpression" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ClinicalImpression_History_id_idx"
  ON "ClinicalImpression_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_History_lastUpdated_idx"
  ON "ClinicalImpression_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ClinicalImpression_References_targetId_code_idx"
  ON "ClinicalImpression_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CodeSystem_lastUpdated_idx"
  ON "CodeSystem" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CodeSystem_projectId_lastUpdated_idx"
  ON "CodeSystem" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CodeSystem_projectId_idx"
  ON "CodeSystem" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CodeSystem__source_idx"
  ON "CodeSystem" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CodeSystem_profile_idx"
  ON "CodeSystem" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CodeSystem___version_idx"
  ON "CodeSystem" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CodeSystem_reindex_idx"
  ON "CodeSystem" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CodeSystem_compartments_idx"
  ON "CodeSystem" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CodeSystem___code_idx"
  ON "CodeSystem" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "CodeSystem___contentMode_idx"
  ON "CodeSystem" USING gin ("__contentMode");

CREATE INDEX IF NOT EXISTS "CodeSystem___context_idx"
  ON "CodeSystem" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "CodeSystem_contextQuantity_idx"
  ON "CodeSystem" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "CodeSystem___contextType_idx"
  ON "CodeSystem" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "CodeSystem_date_idx"
  ON "CodeSystem" USING btree ("date");

CREATE INDEX IF NOT EXISTS "CodeSystem_description_idx"
  ON "CodeSystem" USING btree ("description");

CREATE INDEX IF NOT EXISTS "CodeSystem___identifier_idx"
  ON "CodeSystem" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CodeSystem___jurisdiction_idx"
  ON "CodeSystem" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "CodeSystem___language_idx"
  ON "CodeSystem" USING gin ("__language");

CREATE INDEX IF NOT EXISTS "CodeSystem___nameSort_idx"
  ON "CodeSystem" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "CodeSystem_publisher_idx"
  ON "CodeSystem" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "CodeSystem___status_idx"
  ON "CodeSystem" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CodeSystem_supplements_idx"
  ON "CodeSystem" USING btree ("supplements");

CREATE INDEX IF NOT EXISTS "CodeSystem_system_idx"
  ON "CodeSystem" USING btree ("system");

CREATE INDEX IF NOT EXISTS "CodeSystem_title_idx"
  ON "CodeSystem" USING btree ("title");

CREATE INDEX IF NOT EXISTS "CodeSystem_url_idx"
  ON "CodeSystem" USING btree ("url");

CREATE INDEX IF NOT EXISTS "CodeSystem_version_idx"
  ON "CodeSystem" USING btree ("version");

CREATE INDEX IF NOT EXISTS "CodeSystem___sharedTokens_idx"
  ON "CodeSystem" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CodeSystem___codeText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___contentModeText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__contentModeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___contextText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___contextTypeText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___identifierText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___jurisdictionText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___languageText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__languageText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___statusText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem____tagText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem___sharedTokensText_trgm_idx"
  ON "CodeSystem" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CodeSystem_History_id_idx"
  ON "CodeSystem_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CodeSystem_History_lastUpdated_idx"
  ON "CodeSystem_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CodeSystem_References_targetId_code_idx"
  ON "CodeSystem_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Communication_lastUpdated_idx"
  ON "Communication" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Communication_projectId_lastUpdated_idx"
  ON "Communication" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Communication_projectId_idx"
  ON "Communication" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Communication__source_idx"
  ON "Communication" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Communication_profile_idx"
  ON "Communication" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Communication___version_idx"
  ON "Communication" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Communication_reindex_idx"
  ON "Communication" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Communication_compartments_idx"
  ON "Communication" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Communication_basedOn_idx"
  ON "Communication" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Communication___category_idx"
  ON "Communication" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Communication_encounter_idx"
  ON "Communication" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Communication___identifier_idx"
  ON "Communication" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Communication_instantiatesCanonical_idx"
  ON "Communication" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "Communication_instantiatesUri_idx"
  ON "Communication" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "Communication___medium_idx"
  ON "Communication" USING gin ("__medium");

CREATE INDEX IF NOT EXISTS "Communication_partOf_idx"
  ON "Communication" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "Communication_patient_idx"
  ON "Communication" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Communication_received_idx"
  ON "Communication" USING btree ("received");

CREATE INDEX IF NOT EXISTS "Communication_recipient_idx"
  ON "Communication" USING gin ("recipient");

CREATE INDEX IF NOT EXISTS "Communication_sender_idx"
  ON "Communication" USING btree ("sender");

CREATE INDEX IF NOT EXISTS "Communication_sent_idx"
  ON "Communication" USING btree ("sent");

CREATE INDEX IF NOT EXISTS "Communication___status_idx"
  ON "Communication" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Communication_subject_idx"
  ON "Communication" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Communication___sharedTokens_idx"
  ON "Communication" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Communication___categoryText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication___identifierText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication___mediumText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("__mediumText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication___statusText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication____tagText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication___sharedTokensText_trgm_idx"
  ON "Communication" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Communication_History_id_idx"
  ON "Communication_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Communication_History_lastUpdated_idx"
  ON "Communication_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Communication_References_targetId_code_idx"
  ON "Communication_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_lastUpdated_idx"
  ON "CommunicationRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_projectId_lastUpdated_idx"
  ON "CommunicationRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_projectId_idx"
  ON "CommunicationRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CommunicationRequest__source_idx"
  ON "CommunicationRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_profile_idx"
  ON "CommunicationRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___version_idx"
  ON "CommunicationRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_reindex_idx"
  ON "CommunicationRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CommunicationRequest_compartments_idx"
  ON "CommunicationRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_authored_idx"
  ON "CommunicationRequest" USING btree ("authored");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_basedOn_idx"
  ON "CommunicationRequest" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___category_idx"
  ON "CommunicationRequest" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_encounter_idx"
  ON "CommunicationRequest" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___groupIdentifier_idx"
  ON "CommunicationRequest" USING gin ("__groupIdentifier");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___identifier_idx"
  ON "CommunicationRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___medium_idx"
  ON "CommunicationRequest" USING gin ("__medium");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_occurrence_idx"
  ON "CommunicationRequest" USING btree ("occurrence");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_patient_idx"
  ON "CommunicationRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___priority_idx"
  ON "CommunicationRequest" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_recipient_idx"
  ON "CommunicationRequest" USING gin ("recipient");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_replaces_idx"
  ON "CommunicationRequest" USING gin ("replaces");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_requester_idx"
  ON "CommunicationRequest" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_sender_idx"
  ON "CommunicationRequest" USING btree ("sender");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___status_idx"
  ON "CommunicationRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_subject_idx"
  ON "CommunicationRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___sharedTokens_idx"
  ON "CommunicationRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CommunicationRequest___categoryText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___groupIdentifierText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__groupIdentifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___identifierText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___mediumText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__mediumText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___priorityText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___statusText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest____tagText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest___sharedTokensText_trgm_idx"
  ON "CommunicationRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunicationRequest_History_id_idx"
  ON "CommunicationRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_History_lastUpdated_idx"
  ON "CommunicationRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CommunicationRequest_References_targetId_code_idx"
  ON "CommunicationRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_lastUpdated_idx"
  ON "CompartmentDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_projectId_lastUpdated_idx"
  ON "CompartmentDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_projectId_idx"
  ON "CompartmentDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition__source_idx"
  ON "CompartmentDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_profile_idx"
  ON "CompartmentDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___version_idx"
  ON "CompartmentDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_reindex_idx"
  ON "CompartmentDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_compartments_idx"
  ON "CompartmentDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___code_idx"
  ON "CompartmentDefinition" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___context_idx"
  ON "CompartmentDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_contextQuantity_idx"
  ON "CompartmentDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___contextType_idx"
  ON "CompartmentDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_date_idx"
  ON "CompartmentDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_description_idx"
  ON "CompartmentDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___nameSort_idx"
  ON "CompartmentDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_publisher_idx"
  ON "CompartmentDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___resource_idx"
  ON "CompartmentDefinition" USING gin ("__resource");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___status_idx"
  ON "CompartmentDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_url_idx"
  ON "CompartmentDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_version_idx"
  ON "CompartmentDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___sharedTokens_idx"
  ON "CompartmentDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___codeText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___contextText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___contextTypeText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___resourceText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__resourceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___statusText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition____tagText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition___sharedTokensText_trgm_idx"
  ON "CompartmentDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_History_id_idx"
  ON "CompartmentDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_History_lastUpdated_idx"
  ON "CompartmentDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CompartmentDefinition_References_targetId_code_idx"
  ON "CompartmentDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Composition_lastUpdated_idx"
  ON "Composition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Composition_projectId_lastUpdated_idx"
  ON "Composition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Composition_projectId_idx"
  ON "Composition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Composition__source_idx"
  ON "Composition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Composition_profile_idx"
  ON "Composition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Composition___version_idx"
  ON "Composition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Composition_reindex_idx"
  ON "Composition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Composition_compartments_idx"
  ON "Composition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Composition_attester_idx"
  ON "Composition" USING gin ("attester");

CREATE INDEX IF NOT EXISTS "Composition_author_idx"
  ON "Composition" USING gin ("author");

CREATE INDEX IF NOT EXISTS "Composition___category_idx"
  ON "Composition" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Composition___confidentiality_idx"
  ON "Composition" USING gin ("__confidentiality");

CREATE INDEX IF NOT EXISTS "Composition___context_idx"
  ON "Composition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "Composition_date_idx"
  ON "Composition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Composition_encounter_idx"
  ON "Composition" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Composition_entry_idx"
  ON "Composition" USING gin ("entry");

CREATE INDEX IF NOT EXISTS "Composition___identifier_idx"
  ON "Composition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Composition_patient_idx"
  ON "Composition" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Composition_period_idx"
  ON "Composition" USING gin ("period");

CREATE INDEX IF NOT EXISTS "Composition___relatedId_idx"
  ON "Composition" USING gin ("__relatedId");

CREATE INDEX IF NOT EXISTS "Composition_relatedRef_idx"
  ON "Composition" USING gin ("relatedRef");

CREATE INDEX IF NOT EXISTS "Composition___section_idx"
  ON "Composition" USING gin ("__section");

CREATE INDEX IF NOT EXISTS "Composition___status_idx"
  ON "Composition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Composition_subject_idx"
  ON "Composition" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Composition_title_idx"
  ON "Composition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "Composition___type_idx"
  ON "Composition" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Composition___sharedTokens_idx"
  ON "Composition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Composition___categoryText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___confidentialityText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__confidentialityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___contextText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___identifierText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___relatedIdText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__relatedIdText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___sectionText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__sectionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___statusText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___typeText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition____tagText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition___sharedTokensText_trgm_idx"
  ON "Composition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Composition_History_id_idx"
  ON "Composition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Composition_History_lastUpdated_idx"
  ON "Composition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Composition_References_targetId_code_idx"
  ON "Composition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ConceptMap_lastUpdated_idx"
  ON "ConceptMap" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ConceptMap_projectId_lastUpdated_idx"
  ON "ConceptMap" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ConceptMap_projectId_idx"
  ON "ConceptMap" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ConceptMap__source_idx"
  ON "ConceptMap" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ConceptMap_profile_idx"
  ON "ConceptMap" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ConceptMap___version_idx"
  ON "ConceptMap" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ConceptMap_reindex_idx"
  ON "ConceptMap" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ConceptMap_compartments_idx"
  ON "ConceptMap" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ConceptMap___context_idx"
  ON "ConceptMap" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ConceptMap_contextQuantity_idx"
  ON "ConceptMap" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ConceptMap___contextType_idx"
  ON "ConceptMap" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ConceptMap_date_idx"
  ON "ConceptMap" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ConceptMap_dependson_idx"
  ON "ConceptMap" USING gin ("dependson");

CREATE INDEX IF NOT EXISTS "ConceptMap_description_idx"
  ON "ConceptMap" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ConceptMap___identifier_idx"
  ON "ConceptMap" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ConceptMap___jurisdiction_idx"
  ON "ConceptMap" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ConceptMap___nameSort_idx"
  ON "ConceptMap" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ConceptMap_other_idx"
  ON "ConceptMap" USING gin ("other");

CREATE INDEX IF NOT EXISTS "ConceptMap_product_idx"
  ON "ConceptMap" USING gin ("product");

CREATE INDEX IF NOT EXISTS "ConceptMap_publisher_idx"
  ON "ConceptMap" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ConceptMap_source_idx"
  ON "ConceptMap" USING btree ("source");

CREATE INDEX IF NOT EXISTS "ConceptMap___sourceCode_idx"
  ON "ConceptMap" USING gin ("__sourceCode");

CREATE INDEX IF NOT EXISTS "ConceptMap_sourceSystem_idx"
  ON "ConceptMap" USING gin ("sourceSystem");

CREATE INDEX IF NOT EXISTS "ConceptMap_sourceUri_idx"
  ON "ConceptMap" USING btree ("sourceUri");

CREATE INDEX IF NOT EXISTS "ConceptMap___status_idx"
  ON "ConceptMap" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ConceptMap_target_idx"
  ON "ConceptMap" USING btree ("target");

CREATE INDEX IF NOT EXISTS "ConceptMap___targetCode_idx"
  ON "ConceptMap" USING gin ("__targetCode");

CREATE INDEX IF NOT EXISTS "ConceptMap_targetSystem_idx"
  ON "ConceptMap" USING gin ("targetSystem");

CREATE INDEX IF NOT EXISTS "ConceptMap_targetUri_idx"
  ON "ConceptMap" USING btree ("targetUri");

CREATE INDEX IF NOT EXISTS "ConceptMap_title_idx"
  ON "ConceptMap" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ConceptMap_url_idx"
  ON "ConceptMap" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ConceptMap_version_idx"
  ON "ConceptMap" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ConceptMap___sharedTokens_idx"
  ON "ConceptMap" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ConceptMap___contextText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___contextTypeText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___identifierText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___jurisdictionText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___sourceCodeText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__sourceCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___statusText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___targetCodeText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__targetCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap____tagText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap___sharedTokensText_trgm_idx"
  ON "ConceptMap" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ConceptMap_History_id_idx"
  ON "ConceptMap_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ConceptMap_History_lastUpdated_idx"
  ON "ConceptMap_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ConceptMap_References_targetId_code_idx"
  ON "ConceptMap_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Condition_lastUpdated_idx"
  ON "Condition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Condition_projectId_lastUpdated_idx"
  ON "Condition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Condition_projectId_idx"
  ON "Condition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Condition__source_idx"
  ON "Condition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Condition_profile_idx"
  ON "Condition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Condition___version_idx"
  ON "Condition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Condition_reindex_idx"
  ON "Condition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Condition_compartments_idx"
  ON "Condition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Condition_abatementAge_idx"
  ON "Condition" USING btree ("abatementAge");

CREATE INDEX IF NOT EXISTS "Condition_abatementDate_idx"
  ON "Condition" USING btree ("abatementDate");

CREATE INDEX IF NOT EXISTS "Condition_abatementString_idx"
  ON "Condition" USING btree ("abatementString");

CREATE INDEX IF NOT EXISTS "Condition_asserter_idx"
  ON "Condition" USING btree ("asserter");

CREATE INDEX IF NOT EXISTS "Condition___bodySite_idx"
  ON "Condition" USING gin ("__bodySite");

CREATE INDEX IF NOT EXISTS "Condition___category_idx"
  ON "Condition" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Condition___clinicalStatus_idx"
  ON "Condition" USING gin ("__clinicalStatus");

CREATE INDEX IF NOT EXISTS "Condition___code_idx"
  ON "Condition" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Condition_encounter_idx"
  ON "Condition" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Condition___evidence_idx"
  ON "Condition" USING gin ("__evidence");

CREATE INDEX IF NOT EXISTS "Condition_evidenceDetail_idx"
  ON "Condition" USING gin ("evidenceDetail");

CREATE INDEX IF NOT EXISTS "Condition___identifier_idx"
  ON "Condition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Condition_onsetAge_idx"
  ON "Condition" USING btree ("onsetAge");

CREATE INDEX IF NOT EXISTS "Condition_onsetDate_idx"
  ON "Condition" USING btree ("onsetDate");

CREATE INDEX IF NOT EXISTS "Condition_onsetInfo_idx"
  ON "Condition" USING btree ("onsetInfo");

CREATE INDEX IF NOT EXISTS "Condition_patient_idx"
  ON "Condition" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Condition_recordedDate_idx"
  ON "Condition" USING btree ("recordedDate");

CREATE INDEX IF NOT EXISTS "Condition___severity_idx"
  ON "Condition" USING gin ("__severity");

CREATE INDEX IF NOT EXISTS "Condition___stage_idx"
  ON "Condition" USING gin ("__stage");

CREATE INDEX IF NOT EXISTS "Condition_subject_idx"
  ON "Condition" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Condition___verificationStatus_idx"
  ON "Condition" USING gin ("__verificationStatus");

CREATE INDEX IF NOT EXISTS "Condition___sharedTokens_idx"
  ON "Condition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Condition___bodySiteText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__bodySiteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___categoryText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___clinicalStatusText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__clinicalStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___codeText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___evidenceText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__evidenceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___identifierText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___severityText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__severityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___stageText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__stageText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___verificationStatusText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__verificationStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition____tagText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition___sharedTokensText_trgm_idx"
  ON "Condition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Condition_History_id_idx"
  ON "Condition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Condition_History_lastUpdated_idx"
  ON "Condition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Condition_References_targetId_code_idx"
  ON "Condition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Consent_lastUpdated_idx"
  ON "Consent" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Consent_projectId_lastUpdated_idx"
  ON "Consent" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Consent_projectId_idx"
  ON "Consent" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Consent__source_idx"
  ON "Consent" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Consent_profile_idx"
  ON "Consent" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Consent___version_idx"
  ON "Consent" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Consent_reindex_idx"
  ON "Consent" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Consent_compartments_idx"
  ON "Consent" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Consent___action_idx"
  ON "Consent" USING gin ("__action");

CREATE INDEX IF NOT EXISTS "Consent_actor_idx"
  ON "Consent" USING gin ("actor");

CREATE INDEX IF NOT EXISTS "Consent___category_idx"
  ON "Consent" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Consent_consentor_idx"
  ON "Consent" USING gin ("consentor");

CREATE INDEX IF NOT EXISTS "Consent_data_idx"
  ON "Consent" USING gin ("data");

CREATE INDEX IF NOT EXISTS "Consent_date_idx"
  ON "Consent" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Consent___identifier_idx"
  ON "Consent" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Consent_organization_idx"
  ON "Consent" USING gin ("organization");

CREATE INDEX IF NOT EXISTS "Consent_patient_idx"
  ON "Consent" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Consent_period_idx"
  ON "Consent" USING btree ("period");

CREATE INDEX IF NOT EXISTS "Consent___purpose_idx"
  ON "Consent" USING gin ("__purpose");

CREATE INDEX IF NOT EXISTS "Consent___scope_idx"
  ON "Consent" USING gin ("__scope");

CREATE INDEX IF NOT EXISTS "Consent___securityLabel_idx"
  ON "Consent" USING gin ("__securityLabel");

CREATE INDEX IF NOT EXISTS "Consent_sourceReference_idx"
  ON "Consent" USING btree ("sourceReference");

CREATE INDEX IF NOT EXISTS "Consent___status_idx"
  ON "Consent" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Consent___sharedTokens_idx"
  ON "Consent" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Consent___actionText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__actionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___categoryText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___identifierText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___purposeText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__purposeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___scopeText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__scopeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___securityLabelText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__securityLabelText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___statusText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent____tagText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent___sharedTokensText_trgm_idx"
  ON "Consent" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Consent_History_id_idx"
  ON "Consent_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Consent_History_lastUpdated_idx"
  ON "Consent_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Consent_References_targetId_code_idx"
  ON "Consent_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Contract_lastUpdated_idx"
  ON "Contract" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Contract_projectId_lastUpdated_idx"
  ON "Contract" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Contract_projectId_idx"
  ON "Contract" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Contract__source_idx"
  ON "Contract" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Contract_profile_idx"
  ON "Contract" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Contract___version_idx"
  ON "Contract" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Contract_reindex_idx"
  ON "Contract" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Contract_compartments_idx"
  ON "Contract" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Contract_authority_idx"
  ON "Contract" USING gin ("authority");

CREATE INDEX IF NOT EXISTS "Contract_domain_idx"
  ON "Contract" USING gin ("domain");

CREATE INDEX IF NOT EXISTS "Contract___identifier_idx"
  ON "Contract" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Contract_instantiates_idx"
  ON "Contract" USING btree ("instantiates");

CREATE INDEX IF NOT EXISTS "Contract_issued_idx"
  ON "Contract" USING btree ("issued");

CREATE INDEX IF NOT EXISTS "Contract_patient_idx"
  ON "Contract" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "Contract_signer_idx"
  ON "Contract" USING gin ("signer");

CREATE INDEX IF NOT EXISTS "Contract___status_idx"
  ON "Contract" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Contract_subject_idx"
  ON "Contract" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "Contract_url_idx"
  ON "Contract" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Contract___sharedTokens_idx"
  ON "Contract" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Contract___identifierText_trgm_idx"
  ON "Contract" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Contract___statusText_trgm_idx"
  ON "Contract" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Contract____tagText_trgm_idx"
  ON "Contract" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Contract___sharedTokensText_trgm_idx"
  ON "Contract" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Contract_History_id_idx"
  ON "Contract_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Contract_History_lastUpdated_idx"
  ON "Contract_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Contract_References_targetId_code_idx"
  ON "Contract_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Coverage_lastUpdated_idx"
  ON "Coverage" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Coverage_projectId_lastUpdated_idx"
  ON "Coverage" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Coverage_projectId_idx"
  ON "Coverage" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Coverage__source_idx"
  ON "Coverage" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Coverage_profile_idx"
  ON "Coverage" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Coverage___version_idx"
  ON "Coverage" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Coverage_reindex_idx"
  ON "Coverage" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Coverage_compartments_idx"
  ON "Coverage" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Coverage_beneficiary_idx"
  ON "Coverage" USING btree ("beneficiary");

CREATE INDEX IF NOT EXISTS "Coverage___classType_idx"
  ON "Coverage" USING gin ("__classType");

CREATE INDEX IF NOT EXISTS "Coverage_classValue_idx"
  ON "Coverage" USING gin ("classValue");

CREATE INDEX IF NOT EXISTS "Coverage_dependent_idx"
  ON "Coverage" USING btree ("dependent");

CREATE INDEX IF NOT EXISTS "Coverage___identifier_idx"
  ON "Coverage" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Coverage_patient_idx"
  ON "Coverage" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Coverage_payor_idx"
  ON "Coverage" USING gin ("payor");

CREATE INDEX IF NOT EXISTS "Coverage_policyHolder_idx"
  ON "Coverage" USING btree ("policyHolder");

CREATE INDEX IF NOT EXISTS "Coverage___status_idx"
  ON "Coverage" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Coverage_subscriber_idx"
  ON "Coverage" USING btree ("subscriber");

CREATE INDEX IF NOT EXISTS "Coverage___type_idx"
  ON "Coverage" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Coverage___sharedTokens_idx"
  ON "Coverage" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Coverage___classTypeText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("__classTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage___identifierText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage___statusText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage___typeText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage____tagText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage___sharedTokensText_trgm_idx"
  ON "Coverage" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Coverage_History_id_idx"
  ON "Coverage_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Coverage_History_lastUpdated_idx"
  ON "Coverage_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Coverage_References_targetId_code_idx"
  ON "Coverage_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_lastUpdated_idx"
  ON "CoverageEligibilityRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_projectId_lastUpdated_idx"
  ON "CoverageEligibilityRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_projectId_idx"
  ON "CoverageEligibilityRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest__source_idx"
  ON "CoverageEligibilityRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_profile_idx"
  ON "CoverageEligibilityRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___version_idx"
  ON "CoverageEligibilityRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_reindex_idx"
  ON "CoverageEligibilityRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_compartments_idx"
  ON "CoverageEligibilityRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_created_idx"
  ON "CoverageEligibilityRequest" USING btree ("created");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_enterer_idx"
  ON "CoverageEligibilityRequest" USING btree ("enterer");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_facility_idx"
  ON "CoverageEligibilityRequest" USING btree ("facility");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___identifier_idx"
  ON "CoverageEligibilityRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_patient_idx"
  ON "CoverageEligibilityRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_provider_idx"
  ON "CoverageEligibilityRequest" USING btree ("provider");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___status_idx"
  ON "CoverageEligibilityRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___sharedTokens_idx"
  ON "CoverageEligibilityRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___identifierText_trgm_idx"
  ON "CoverageEligibilityRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___statusText_trgm_idx"
  ON "CoverageEligibilityRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest____tagText_trgm_idx"
  ON "CoverageEligibilityRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest___sharedTokensText_trgm_idx"
  ON "CoverageEligibilityRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_History_id_idx"
  ON "CoverageEligibilityRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_History_lastUpdated_idx"
  ON "CoverageEligibilityRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityRequest_References_targetId_code_idx"
  ON "CoverageEligibilityRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_lastUpdated_idx"
  ON "CoverageEligibilityResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_projectId_lastUpdated_idx"
  ON "CoverageEligibilityResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_projectId_idx"
  ON "CoverageEligibilityResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse__source_idx"
  ON "CoverageEligibilityResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_profile_idx"
  ON "CoverageEligibilityResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___version_idx"
  ON "CoverageEligibilityResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_reindex_idx"
  ON "CoverageEligibilityResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_compartments_idx"
  ON "CoverageEligibilityResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_created_idx"
  ON "CoverageEligibilityResponse" USING btree ("created");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_disposition_idx"
  ON "CoverageEligibilityResponse" USING btree ("disposition");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___identifier_idx"
  ON "CoverageEligibilityResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_insurer_idx"
  ON "CoverageEligibilityResponse" USING btree ("insurer");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___outcome_idx"
  ON "CoverageEligibilityResponse" USING gin ("__outcome");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_patient_idx"
  ON "CoverageEligibilityResponse" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_request_idx"
  ON "CoverageEligibilityResponse" USING btree ("request");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_requestor_idx"
  ON "CoverageEligibilityResponse" USING btree ("requestor");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___status_idx"
  ON "CoverageEligibilityResponse" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___sharedTokens_idx"
  ON "CoverageEligibilityResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___identifierText_trgm_idx"
  ON "CoverageEligibilityResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___outcomeText_trgm_idx"
  ON "CoverageEligibilityResponse" USING gin (token_array_to_text("__outcomeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___statusText_trgm_idx"
  ON "CoverageEligibilityResponse" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse____tagText_trgm_idx"
  ON "CoverageEligibilityResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse___sharedTokensText_trgm_idx"
  ON "CoverageEligibilityResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_History_id_idx"
  ON "CoverageEligibilityResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_History_lastUpdated_idx"
  ON "CoverageEligibilityResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "CoverageEligibilityResponse_References_targetId_code_idx"
  ON "CoverageEligibilityResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DetectedIssue_lastUpdated_idx"
  ON "DetectedIssue" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DetectedIssue_projectId_lastUpdated_idx"
  ON "DetectedIssue" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DetectedIssue_projectId_idx"
  ON "DetectedIssue" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DetectedIssue__source_idx"
  ON "DetectedIssue" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DetectedIssue_profile_idx"
  ON "DetectedIssue" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DetectedIssue___version_idx"
  ON "DetectedIssue" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DetectedIssue_reindex_idx"
  ON "DetectedIssue" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DetectedIssue_compartments_idx"
  ON "DetectedIssue" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DetectedIssue_author_idx"
  ON "DetectedIssue" USING btree ("author");

CREATE INDEX IF NOT EXISTS "DetectedIssue___code_idx"
  ON "DetectedIssue" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "DetectedIssue_identified_idx"
  ON "DetectedIssue" USING btree ("identified");

CREATE INDEX IF NOT EXISTS "DetectedIssue___identifier_idx"
  ON "DetectedIssue" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DetectedIssue_implicated_idx"
  ON "DetectedIssue" USING gin ("implicated");

CREATE INDEX IF NOT EXISTS "DetectedIssue_patient_idx"
  ON "DetectedIssue" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DetectedIssue___sharedTokens_idx"
  ON "DetectedIssue" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DetectedIssue___codeText_trgm_idx"
  ON "DetectedIssue" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DetectedIssue___identifierText_trgm_idx"
  ON "DetectedIssue" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DetectedIssue____tagText_trgm_idx"
  ON "DetectedIssue" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DetectedIssue___sharedTokensText_trgm_idx"
  ON "DetectedIssue" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DetectedIssue_History_id_idx"
  ON "DetectedIssue_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DetectedIssue_History_lastUpdated_idx"
  ON "DetectedIssue_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DetectedIssue_References_targetId_code_idx"
  ON "DetectedIssue_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Device_lastUpdated_idx"
  ON "Device" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Device_projectId_lastUpdated_idx"
  ON "Device" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Device_projectId_idx"
  ON "Device" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Device__source_idx"
  ON "Device" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Device_profile_idx"
  ON "Device" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Device___version_idx"
  ON "Device" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Device_reindex_idx"
  ON "Device" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Device_compartments_idx"
  ON "Device" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Device_deviceName_idx"
  ON "Device" USING gin ("deviceName");

CREATE INDEX IF NOT EXISTS "Device___identifier_idx"
  ON "Device" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Device_location_idx"
  ON "Device" USING btree ("location");

CREATE INDEX IF NOT EXISTS "Device_manufacturer_idx"
  ON "Device" USING btree ("manufacturer");

CREATE INDEX IF NOT EXISTS "Device_model_idx"
  ON "Device" USING btree ("model");

CREATE INDEX IF NOT EXISTS "Device_organization_idx"
  ON "Device" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "Device_patient_idx"
  ON "Device" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Device___status_idx"
  ON "Device" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Device___type_idx"
  ON "Device" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Device_udiCarrier_idx"
  ON "Device" USING gin ("udiCarrier");

CREATE INDEX IF NOT EXISTS "Device_udiDi_idx"
  ON "Device" USING gin ("udiDi");

CREATE INDEX IF NOT EXISTS "Device_url_idx"
  ON "Device" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Device___sharedTokens_idx"
  ON "Device" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Device___identifierText_trgm_idx"
  ON "Device" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Device___statusText_trgm_idx"
  ON "Device" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Device___typeText_trgm_idx"
  ON "Device" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Device____tagText_trgm_idx"
  ON "Device" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Device___sharedTokensText_trgm_idx"
  ON "Device" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Device_History_id_idx"
  ON "Device_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Device_History_lastUpdated_idx"
  ON "Device_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Device_References_targetId_code_idx"
  ON "Device_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_lastUpdated_idx"
  ON "DeviceDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_projectId_lastUpdated_idx"
  ON "DeviceDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_projectId_idx"
  ON "DeviceDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DeviceDefinition__source_idx"
  ON "DeviceDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_profile_idx"
  ON "DeviceDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DeviceDefinition___version_idx"
  ON "DeviceDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_reindex_idx"
  ON "DeviceDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DeviceDefinition_compartments_idx"
  ON "DeviceDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DeviceDefinition___identifier_idx"
  ON "DeviceDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_parent_idx"
  ON "DeviceDefinition" USING btree ("parent");

CREATE INDEX IF NOT EXISTS "DeviceDefinition___type_idx"
  ON "DeviceDefinition" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "DeviceDefinition___sharedTokens_idx"
  ON "DeviceDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DeviceDefinition___identifierText_trgm_idx"
  ON "DeviceDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceDefinition___typeText_trgm_idx"
  ON "DeviceDefinition" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceDefinition____tagText_trgm_idx"
  ON "DeviceDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceDefinition___sharedTokensText_trgm_idx"
  ON "DeviceDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceDefinition_History_id_idx"
  ON "DeviceDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_History_lastUpdated_idx"
  ON "DeviceDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceDefinition_References_targetId_code_idx"
  ON "DeviceDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DeviceMetric_lastUpdated_idx"
  ON "DeviceMetric" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceMetric_projectId_lastUpdated_idx"
  ON "DeviceMetric" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceMetric_projectId_idx"
  ON "DeviceMetric" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DeviceMetric__source_idx"
  ON "DeviceMetric" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DeviceMetric_profile_idx"
  ON "DeviceMetric" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DeviceMetric___version_idx"
  ON "DeviceMetric" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DeviceMetric_reindex_idx"
  ON "DeviceMetric" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DeviceMetric_compartments_idx"
  ON "DeviceMetric" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DeviceMetric___category_idx"
  ON "DeviceMetric" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "DeviceMetric___identifier_idx"
  ON "DeviceMetric" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DeviceMetric_parent_idx"
  ON "DeviceMetric" USING btree ("parent");

CREATE INDEX IF NOT EXISTS "DeviceMetric_source_idx"
  ON "DeviceMetric" USING btree ("source");

CREATE INDEX IF NOT EXISTS "DeviceMetric___type_idx"
  ON "DeviceMetric" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "DeviceMetric___sharedTokens_idx"
  ON "DeviceMetric" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DeviceMetric___categoryText_trgm_idx"
  ON "DeviceMetric" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceMetric___identifierText_trgm_idx"
  ON "DeviceMetric" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceMetric___typeText_trgm_idx"
  ON "DeviceMetric" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceMetric____tagText_trgm_idx"
  ON "DeviceMetric" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceMetric___sharedTokensText_trgm_idx"
  ON "DeviceMetric" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceMetric_History_id_idx"
  ON "DeviceMetric_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DeviceMetric_History_lastUpdated_idx"
  ON "DeviceMetric_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceMetric_References_targetId_code_idx"
  ON "DeviceMetric_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DeviceRequest_lastUpdated_idx"
  ON "DeviceRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceRequest_projectId_lastUpdated_idx"
  ON "DeviceRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceRequest_projectId_idx"
  ON "DeviceRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DeviceRequest__source_idx"
  ON "DeviceRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DeviceRequest_profile_idx"
  ON "DeviceRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DeviceRequest___version_idx"
  ON "DeviceRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DeviceRequest_reindex_idx"
  ON "DeviceRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DeviceRequest_compartments_idx"
  ON "DeviceRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DeviceRequest_authoredOn_idx"
  ON "DeviceRequest" USING btree ("authoredOn");

CREATE INDEX IF NOT EXISTS "DeviceRequest_basedOn_idx"
  ON "DeviceRequest" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "DeviceRequest___code_idx"
  ON "DeviceRequest" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "DeviceRequest_device_idx"
  ON "DeviceRequest" USING btree ("device");

CREATE INDEX IF NOT EXISTS "DeviceRequest_encounter_idx"
  ON "DeviceRequest" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "DeviceRequest_eventDate_idx"
  ON "DeviceRequest" USING btree ("eventDate");

CREATE INDEX IF NOT EXISTS "DeviceRequest___groupIdentifier_idx"
  ON "DeviceRequest" USING gin ("__groupIdentifier");

CREATE INDEX IF NOT EXISTS "DeviceRequest___identifier_idx"
  ON "DeviceRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DeviceRequest_instantiatesCanonical_idx"
  ON "DeviceRequest" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "DeviceRequest_instantiatesUri_idx"
  ON "DeviceRequest" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "DeviceRequest_insurance_idx"
  ON "DeviceRequest" USING gin ("insurance");

CREATE INDEX IF NOT EXISTS "DeviceRequest___intent_idx"
  ON "DeviceRequest" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "DeviceRequest_patient_idx"
  ON "DeviceRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DeviceRequest_performer_idx"
  ON "DeviceRequest" USING btree ("performer");

CREATE INDEX IF NOT EXISTS "DeviceRequest_priorRequest_idx"
  ON "DeviceRequest" USING gin ("priorRequest");

CREATE INDEX IF NOT EXISTS "DeviceRequest_requester_idx"
  ON "DeviceRequest" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "DeviceRequest___status_idx"
  ON "DeviceRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "DeviceRequest_subject_idx"
  ON "DeviceRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "DeviceRequest___sharedTokens_idx"
  ON "DeviceRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DeviceRequest___codeText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest___groupIdentifierText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__groupIdentifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest___identifierText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest___intentText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest___statusText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest____tagText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest___sharedTokensText_trgm_idx"
  ON "DeviceRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceRequest_History_id_idx"
  ON "DeviceRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DeviceRequest_History_lastUpdated_idx"
  ON "DeviceRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceRequest_References_targetId_code_idx"
  ON "DeviceRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_lastUpdated_idx"
  ON "DeviceUseStatement" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_projectId_lastUpdated_idx"
  ON "DeviceUseStatement" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_projectId_idx"
  ON "DeviceUseStatement" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement__source_idx"
  ON "DeviceUseStatement" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_profile_idx"
  ON "DeviceUseStatement" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement___version_idx"
  ON "DeviceUseStatement" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_reindex_idx"
  ON "DeviceUseStatement" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_compartments_idx"
  ON "DeviceUseStatement" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_device_idx"
  ON "DeviceUseStatement" USING btree ("device");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement___identifier_idx"
  ON "DeviceUseStatement" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_patient_idx"
  ON "DeviceUseStatement" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_subject_idx"
  ON "DeviceUseStatement" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement___sharedTokens_idx"
  ON "DeviceUseStatement" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement___identifierText_trgm_idx"
  ON "DeviceUseStatement" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceUseStatement____tagText_trgm_idx"
  ON "DeviceUseStatement" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceUseStatement___sharedTokensText_trgm_idx"
  ON "DeviceUseStatement" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_History_id_idx"
  ON "DeviceUseStatement_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_History_lastUpdated_idx"
  ON "DeviceUseStatement_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DeviceUseStatement_References_targetId_code_idx"
  ON "DeviceUseStatement_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_lastUpdated_idx"
  ON "DiagnosticReport" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_projectId_lastUpdated_idx"
  ON "DiagnosticReport" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_projectId_idx"
  ON "DiagnosticReport" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DiagnosticReport__source_idx"
  ON "DiagnosticReport" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_profile_idx"
  ON "DiagnosticReport" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___version_idx"
  ON "DiagnosticReport" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_reindex_idx"
  ON "DiagnosticReport" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DiagnosticReport_compartments_idx"
  ON "DiagnosticReport" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_basedOn_idx"
  ON "DiagnosticReport" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___category_idx"
  ON "DiagnosticReport" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___code_idx"
  ON "DiagnosticReport" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___conclusion_idx"
  ON "DiagnosticReport" USING gin ("__conclusion");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_date_idx"
  ON "DiagnosticReport" USING btree ("date");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_encounter_idx"
  ON "DiagnosticReport" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___identifier_idx"
  ON "DiagnosticReport" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_issued_idx"
  ON "DiagnosticReport" USING btree ("issued");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_media_idx"
  ON "DiagnosticReport" USING gin ("media");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_patient_idx"
  ON "DiagnosticReport" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_performer_idx"
  ON "DiagnosticReport" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_result_idx"
  ON "DiagnosticReport" USING gin ("result");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_resultsInterpreter_idx"
  ON "DiagnosticReport" USING gin ("resultsInterpreter");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_specimen_idx"
  ON "DiagnosticReport" USING gin ("specimen");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___status_idx"
  ON "DiagnosticReport" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_subject_idx"
  ON "DiagnosticReport" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___sharedTokens_idx"
  ON "DiagnosticReport" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DiagnosticReport___categoryText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport___codeText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport___conclusionText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__conclusionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport___identifierText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport___statusText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport____tagText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport___sharedTokensText_trgm_idx"
  ON "DiagnosticReport" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DiagnosticReport_History_id_idx"
  ON "DiagnosticReport_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_History_lastUpdated_idx"
  ON "DiagnosticReport_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DiagnosticReport_References_targetId_code_idx"
  ON "DiagnosticReport_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DocumentManifest_lastUpdated_idx"
  ON "DocumentManifest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentManifest_projectId_lastUpdated_idx"
  ON "DocumentManifest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentManifest_projectId_idx"
  ON "DocumentManifest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DocumentManifest__source_idx"
  ON "DocumentManifest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DocumentManifest_profile_idx"
  ON "DocumentManifest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DocumentManifest___version_idx"
  ON "DocumentManifest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DocumentManifest_reindex_idx"
  ON "DocumentManifest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DocumentManifest_compartments_idx"
  ON "DocumentManifest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DocumentManifest_author_idx"
  ON "DocumentManifest" USING gin ("author");

CREATE INDEX IF NOT EXISTS "DocumentManifest_created_idx"
  ON "DocumentManifest" USING btree ("created");

CREATE INDEX IF NOT EXISTS "DocumentManifest_description_idx"
  ON "DocumentManifest" USING btree ("description");

CREATE INDEX IF NOT EXISTS "DocumentManifest___identifier_idx"
  ON "DocumentManifest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DocumentManifest_item_idx"
  ON "DocumentManifest" USING gin ("item");

CREATE INDEX IF NOT EXISTS "DocumentManifest_patient_idx"
  ON "DocumentManifest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DocumentManifest_recipient_idx"
  ON "DocumentManifest" USING gin ("recipient");

CREATE INDEX IF NOT EXISTS "DocumentManifest___relatedId_idx"
  ON "DocumentManifest" USING gin ("__relatedId");

CREATE INDEX IF NOT EXISTS "DocumentManifest_relatedRef_idx"
  ON "DocumentManifest" USING gin ("relatedRef");

CREATE INDEX IF NOT EXISTS "DocumentManifest_source_idx"
  ON "DocumentManifest" USING btree ("source");

CREATE INDEX IF NOT EXISTS "DocumentManifest___status_idx"
  ON "DocumentManifest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "DocumentManifest_subject_idx"
  ON "DocumentManifest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "DocumentManifest___type_idx"
  ON "DocumentManifest" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "DocumentManifest___sharedTokens_idx"
  ON "DocumentManifest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DocumentManifest___identifierText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest___relatedIdText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("__relatedIdText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest___statusText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest___typeText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest____tagText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest___sharedTokensText_trgm_idx"
  ON "DocumentManifest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentManifest_History_id_idx"
  ON "DocumentManifest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DocumentManifest_History_lastUpdated_idx"
  ON "DocumentManifest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentManifest_References_targetId_code_idx"
  ON "DocumentManifest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "DocumentReference_lastUpdated_idx"
  ON "DocumentReference" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentReference_projectId_lastUpdated_idx"
  ON "DocumentReference" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentReference_projectId_idx"
  ON "DocumentReference" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "DocumentReference__source_idx"
  ON "DocumentReference" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "DocumentReference_profile_idx"
  ON "DocumentReference" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "DocumentReference___version_idx"
  ON "DocumentReference" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "DocumentReference_reindex_idx"
  ON "DocumentReference" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "DocumentReference_compartments_idx"
  ON "DocumentReference" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "DocumentReference_authenticator_idx"
  ON "DocumentReference" USING btree ("authenticator");

CREATE INDEX IF NOT EXISTS "DocumentReference_author_idx"
  ON "DocumentReference" USING gin ("author");

CREATE INDEX IF NOT EXISTS "DocumentReference___category_idx"
  ON "DocumentReference" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "DocumentReference___contenttype_idx"
  ON "DocumentReference" USING gin ("__contenttype");

CREATE INDEX IF NOT EXISTS "DocumentReference_custodian_idx"
  ON "DocumentReference" USING btree ("custodian");

CREATE INDEX IF NOT EXISTS "DocumentReference_date_idx"
  ON "DocumentReference" USING btree ("date");

CREATE INDEX IF NOT EXISTS "DocumentReference_description_idx"
  ON "DocumentReference" USING btree ("description");

CREATE INDEX IF NOT EXISTS "DocumentReference_encounter_idx"
  ON "DocumentReference" USING gin ("encounter");

CREATE INDEX IF NOT EXISTS "DocumentReference___event_idx"
  ON "DocumentReference" USING gin ("__event");

CREATE INDEX IF NOT EXISTS "DocumentReference___facility_idx"
  ON "DocumentReference" USING gin ("__facility");

CREATE INDEX IF NOT EXISTS "DocumentReference___format_idx"
  ON "DocumentReference" USING gin ("__format");

CREATE INDEX IF NOT EXISTS "DocumentReference___identifier_idx"
  ON "DocumentReference" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "DocumentReference___language_idx"
  ON "DocumentReference" USING gin ("__language");

CREATE INDEX IF NOT EXISTS "DocumentReference_location_idx"
  ON "DocumentReference" USING gin ("location");

CREATE INDEX IF NOT EXISTS "DocumentReference_patient_idx"
  ON "DocumentReference" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "DocumentReference_period_idx"
  ON "DocumentReference" USING btree ("period");

CREATE INDEX IF NOT EXISTS "DocumentReference_related_idx"
  ON "DocumentReference" USING gin ("related");

CREATE INDEX IF NOT EXISTS "DocumentReference_relatesto_idx"
  ON "DocumentReference" USING gin ("relatesto");

CREATE INDEX IF NOT EXISTS "DocumentReference___relation_idx"
  ON "DocumentReference" USING gin ("__relation");

CREATE INDEX IF NOT EXISTS "DocumentReference___securityLabel_idx"
  ON "DocumentReference" USING gin ("__securityLabel");

CREATE INDEX IF NOT EXISTS "DocumentReference___setting_idx"
  ON "DocumentReference" USING gin ("__setting");

CREATE INDEX IF NOT EXISTS "DocumentReference___status_idx"
  ON "DocumentReference" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "DocumentReference_subject_idx"
  ON "DocumentReference" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "DocumentReference___type_idx"
  ON "DocumentReference" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "DocumentReference___sharedTokens_idx"
  ON "DocumentReference" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "DocumentReference___categoryText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___contenttypeText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__contenttypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___eventText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__eventText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___facilityText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__facilityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___formatText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__formatText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___identifierText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___languageText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__languageText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___relationText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__relationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___securityLabelText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__securityLabelText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___settingText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__settingText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___statusText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___typeText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference____tagText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference___sharedTokensText_trgm_idx"
  ON "DocumentReference" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "DocumentReference_History_id_idx"
  ON "DocumentReference_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "DocumentReference_History_lastUpdated_idx"
  ON "DocumentReference_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "DocumentReference_References_targetId_code_idx"
  ON "DocumentReference_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_lastUpdated_idx"
  ON "EffectEvidenceSynthesis" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_projectId_lastUpdated_idx"
  ON "EffectEvidenceSynthesis" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_projectId_idx"
  ON "EffectEvidenceSynthesis" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis__source_idx"
  ON "EffectEvidenceSynthesis" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_profile_idx"
  ON "EffectEvidenceSynthesis" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___version_idx"
  ON "EffectEvidenceSynthesis" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_reindex_idx"
  ON "EffectEvidenceSynthesis" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_compartments_idx"
  ON "EffectEvidenceSynthesis" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___context_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_contextQuantity_idx"
  ON "EffectEvidenceSynthesis" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___contextType_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_date_idx"
  ON "EffectEvidenceSynthesis" USING btree ("date");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_description_idx"
  ON "EffectEvidenceSynthesis" USING btree ("description");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_effective_idx"
  ON "EffectEvidenceSynthesis" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___identifier_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___jurisdiction_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___nameSort_idx"
  ON "EffectEvidenceSynthesis" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_publisher_idx"
  ON "EffectEvidenceSynthesis" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___status_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_title_idx"
  ON "EffectEvidenceSynthesis" USING btree ("title");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_url_idx"
  ON "EffectEvidenceSynthesis" USING btree ("url");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_version_idx"
  ON "EffectEvidenceSynthesis" USING btree ("version");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___sharedTokens_idx"
  ON "EffectEvidenceSynthesis" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___contextText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___contextTypeText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___identifierText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___jurisdictionText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___statusText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis____tagText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis___sharedTokensText_trgm_idx"
  ON "EffectEvidenceSynthesis" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_History_id_idx"
  ON "EffectEvidenceSynthesis_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_History_lastUpdated_idx"
  ON "EffectEvidenceSynthesis_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EffectEvidenceSynthesis_References_targetId_code_idx"
  ON "EffectEvidenceSynthesis_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Encounter_lastUpdated_idx"
  ON "Encounter" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Encounter_projectId_lastUpdated_idx"
  ON "Encounter" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Encounter_projectId_idx"
  ON "Encounter" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Encounter__source_idx"
  ON "Encounter" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Encounter_profile_idx"
  ON "Encounter" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Encounter___version_idx"
  ON "Encounter" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Encounter_reindex_idx"
  ON "Encounter" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Encounter_compartments_idx"
  ON "Encounter" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Encounter_account_idx"
  ON "Encounter" USING gin ("account");

CREATE INDEX IF NOT EXISTS "Encounter_appointment_idx"
  ON "Encounter" USING gin ("appointment");

CREATE INDEX IF NOT EXISTS "Encounter_basedOn_idx"
  ON "Encounter" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Encounter___class_idx"
  ON "Encounter" USING gin ("__class");

CREATE INDEX IF NOT EXISTS "Encounter_date_idx"
  ON "Encounter" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Encounter_diagnosis_idx"
  ON "Encounter" USING gin ("diagnosis");

CREATE INDEX IF NOT EXISTS "Encounter_episodeOfCare_idx"
  ON "Encounter" USING gin ("episodeOfCare");

CREATE INDEX IF NOT EXISTS "Encounter___identifier_idx"
  ON "Encounter" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Encounter_length_idx"
  ON "Encounter" USING btree ("length");

CREATE INDEX IF NOT EXISTS "Encounter_location_idx"
  ON "Encounter" USING gin ("location");

CREATE INDEX IF NOT EXISTS "Encounter_locationPeriod_idx"
  ON "Encounter" USING gin ("locationPeriod");

CREATE INDEX IF NOT EXISTS "Encounter_partOf_idx"
  ON "Encounter" USING btree ("partOf");

CREATE INDEX IF NOT EXISTS "Encounter_participant_idx"
  ON "Encounter" USING gin ("participant");

CREATE INDEX IF NOT EXISTS "Encounter___participantType_idx"
  ON "Encounter" USING gin ("__participantType");

CREATE INDEX IF NOT EXISTS "Encounter_patient_idx"
  ON "Encounter" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Encounter_practitioner_idx"
  ON "Encounter" USING gin ("practitioner");

CREATE INDEX IF NOT EXISTS "Encounter___reasonCode_idx"
  ON "Encounter" USING gin ("__reasonCode");

CREATE INDEX IF NOT EXISTS "Encounter_reasonReference_idx"
  ON "Encounter" USING gin ("reasonReference");

CREATE INDEX IF NOT EXISTS "Encounter_serviceProvider_idx"
  ON "Encounter" USING btree ("serviceProvider");

CREATE INDEX IF NOT EXISTS "Encounter___specialArrangement_idx"
  ON "Encounter" USING gin ("__specialArrangement");

CREATE INDEX IF NOT EXISTS "Encounter___status_idx"
  ON "Encounter" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Encounter_subject_idx"
  ON "Encounter" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Encounter___type_idx"
  ON "Encounter" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Encounter___sharedTokens_idx"
  ON "Encounter" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Encounter___classText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__classText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___identifierText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___participantTypeText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__participantTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___reasonCodeText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__reasonCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___specialArrangementText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__specialArrangementText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___statusText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___typeText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter____tagText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter___sharedTokensText_trgm_idx"
  ON "Encounter" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Encounter_History_id_idx"
  ON "Encounter_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Encounter_History_lastUpdated_idx"
  ON "Encounter_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Encounter_References_targetId_code_idx"
  ON "Encounter_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Endpoint_lastUpdated_idx"
  ON "Endpoint" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Endpoint_projectId_lastUpdated_idx"
  ON "Endpoint" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Endpoint_projectId_idx"
  ON "Endpoint" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Endpoint__source_idx"
  ON "Endpoint" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Endpoint_profile_idx"
  ON "Endpoint" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Endpoint___version_idx"
  ON "Endpoint" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Endpoint_reindex_idx"
  ON "Endpoint" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Endpoint_compartments_idx"
  ON "Endpoint" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Endpoint___connectionType_idx"
  ON "Endpoint" USING gin ("__connectionType");

CREATE INDEX IF NOT EXISTS "Endpoint___identifier_idx"
  ON "Endpoint" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Endpoint___nameSort_idx"
  ON "Endpoint" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Endpoint_organization_idx"
  ON "Endpoint" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "Endpoint___payloadType_idx"
  ON "Endpoint" USING gin ("__payloadType");

CREATE INDEX IF NOT EXISTS "Endpoint___status_idx"
  ON "Endpoint" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Endpoint___sharedTokens_idx"
  ON "Endpoint" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Endpoint___connectionTypeText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("__connectionTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint___identifierText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint___payloadTypeText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("__payloadTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint___statusText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint____tagText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint___sharedTokensText_trgm_idx"
  ON "Endpoint" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Endpoint_History_id_idx"
  ON "Endpoint_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Endpoint_History_lastUpdated_idx"
  ON "Endpoint_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Endpoint_References_targetId_code_idx"
  ON "Endpoint_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_lastUpdated_idx"
  ON "EnrollmentRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_projectId_lastUpdated_idx"
  ON "EnrollmentRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_projectId_idx"
  ON "EnrollmentRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest__source_idx"
  ON "EnrollmentRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_profile_idx"
  ON "EnrollmentRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___version_idx"
  ON "EnrollmentRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_reindex_idx"
  ON "EnrollmentRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_compartments_idx"
  ON "EnrollmentRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___identifier_idx"
  ON "EnrollmentRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_patient_idx"
  ON "EnrollmentRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___status_idx"
  ON "EnrollmentRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_subject_idx"
  ON "EnrollmentRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___sharedTokens_idx"
  ON "EnrollmentRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___identifierText_trgm_idx"
  ON "EnrollmentRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___statusText_trgm_idx"
  ON "EnrollmentRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentRequest____tagText_trgm_idx"
  ON "EnrollmentRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentRequest___sharedTokensText_trgm_idx"
  ON "EnrollmentRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_History_id_idx"
  ON "EnrollmentRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_History_lastUpdated_idx"
  ON "EnrollmentRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentRequest_References_targetId_code_idx"
  ON "EnrollmentRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_lastUpdated_idx"
  ON "EnrollmentResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_projectId_lastUpdated_idx"
  ON "EnrollmentResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_projectId_idx"
  ON "EnrollmentResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse__source_idx"
  ON "EnrollmentResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_profile_idx"
  ON "EnrollmentResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___version_idx"
  ON "EnrollmentResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_reindex_idx"
  ON "EnrollmentResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_compartments_idx"
  ON "EnrollmentResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___identifier_idx"
  ON "EnrollmentResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_request_idx"
  ON "EnrollmentResponse" USING btree ("request");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___status_idx"
  ON "EnrollmentResponse" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___sharedTokens_idx"
  ON "EnrollmentResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___identifierText_trgm_idx"
  ON "EnrollmentResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___statusText_trgm_idx"
  ON "EnrollmentResponse" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentResponse____tagText_trgm_idx"
  ON "EnrollmentResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentResponse___sharedTokensText_trgm_idx"
  ON "EnrollmentResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_History_id_idx"
  ON "EnrollmentResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_History_lastUpdated_idx"
  ON "EnrollmentResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EnrollmentResponse_References_targetId_code_idx"
  ON "EnrollmentResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_lastUpdated_idx"
  ON "EpisodeOfCare" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_projectId_lastUpdated_idx"
  ON "EpisodeOfCare" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_projectId_idx"
  ON "EpisodeOfCare" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare__source_idx"
  ON "EpisodeOfCare" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_profile_idx"
  ON "EpisodeOfCare" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___version_idx"
  ON "EpisodeOfCare" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_reindex_idx"
  ON "EpisodeOfCare" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_compartments_idx"
  ON "EpisodeOfCare" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_careManager_idx"
  ON "EpisodeOfCare" USING btree ("careManager");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_condition_idx"
  ON "EpisodeOfCare" USING gin ("condition");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_date_idx"
  ON "EpisodeOfCare" USING btree ("date");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___identifier_idx"
  ON "EpisodeOfCare" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_incomingReferral_idx"
  ON "EpisodeOfCare" USING gin ("incomingReferral");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_organization_idx"
  ON "EpisodeOfCare" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_patient_idx"
  ON "EpisodeOfCare" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___status_idx"
  ON "EpisodeOfCare" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___type_idx"
  ON "EpisodeOfCare" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___sharedTokens_idx"
  ON "EpisodeOfCare" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___identifierText_trgm_idx"
  ON "EpisodeOfCare" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___statusText_trgm_idx"
  ON "EpisodeOfCare" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___typeText_trgm_idx"
  ON "EpisodeOfCare" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EpisodeOfCare____tagText_trgm_idx"
  ON "EpisodeOfCare" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EpisodeOfCare___sharedTokensText_trgm_idx"
  ON "EpisodeOfCare" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_History_id_idx"
  ON "EpisodeOfCare_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_History_lastUpdated_idx"
  ON "EpisodeOfCare_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EpisodeOfCare_References_targetId_code_idx"
  ON "EpisodeOfCare_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EventDefinition_lastUpdated_idx"
  ON "EventDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EventDefinition_projectId_lastUpdated_idx"
  ON "EventDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EventDefinition_projectId_idx"
  ON "EventDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EventDefinition__source_idx"
  ON "EventDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EventDefinition_profile_idx"
  ON "EventDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EventDefinition___version_idx"
  ON "EventDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EventDefinition_reindex_idx"
  ON "EventDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EventDefinition_compartments_idx"
  ON "EventDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EventDefinition_composedOf_idx"
  ON "EventDefinition" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "EventDefinition___context_idx"
  ON "EventDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "EventDefinition_contextQuantity_idx"
  ON "EventDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "EventDefinition___contextType_idx"
  ON "EventDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "EventDefinition_date_idx"
  ON "EventDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "EventDefinition_dependsOn_idx"
  ON "EventDefinition" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "EventDefinition_derivedFrom_idx"
  ON "EventDefinition" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "EventDefinition_description_idx"
  ON "EventDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "EventDefinition_effective_idx"
  ON "EventDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "EventDefinition___identifier_idx"
  ON "EventDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EventDefinition___jurisdiction_idx"
  ON "EventDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "EventDefinition___nameSort_idx"
  ON "EventDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "EventDefinition_predecessor_idx"
  ON "EventDefinition" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "EventDefinition_publisher_idx"
  ON "EventDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "EventDefinition___status_idx"
  ON "EventDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EventDefinition_successor_idx"
  ON "EventDefinition" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "EventDefinition_title_idx"
  ON "EventDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "EventDefinition___topic_idx"
  ON "EventDefinition" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "EventDefinition_url_idx"
  ON "EventDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "EventDefinition_version_idx"
  ON "EventDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "EventDefinition___sharedTokens_idx"
  ON "EventDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EventDefinition___contextText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___contextTypeText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___identifierText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___jurisdictionText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___statusText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___topicText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition____tagText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition___sharedTokensText_trgm_idx"
  ON "EventDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EventDefinition_History_id_idx"
  ON "EventDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EventDefinition_History_lastUpdated_idx"
  ON "EventDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EventDefinition_References_targetId_code_idx"
  ON "EventDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Evidence_lastUpdated_idx"
  ON "Evidence" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Evidence_projectId_lastUpdated_idx"
  ON "Evidence" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Evidence_projectId_idx"
  ON "Evidence" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Evidence__source_idx"
  ON "Evidence" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Evidence_profile_idx"
  ON "Evidence" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Evidence___version_idx"
  ON "Evidence" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Evidence_reindex_idx"
  ON "Evidence" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Evidence_compartments_idx"
  ON "Evidence" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Evidence_composedOf_idx"
  ON "Evidence" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "Evidence___context_idx"
  ON "Evidence" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "Evidence_contextQuantity_idx"
  ON "Evidence" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "Evidence___contextType_idx"
  ON "Evidence" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "Evidence_date_idx"
  ON "Evidence" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Evidence_dependsOn_idx"
  ON "Evidence" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "Evidence_derivedFrom_idx"
  ON "Evidence" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "Evidence_description_idx"
  ON "Evidence" USING btree ("description");

CREATE INDEX IF NOT EXISTS "Evidence_effective_idx"
  ON "Evidence" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "Evidence___identifier_idx"
  ON "Evidence" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Evidence___jurisdiction_idx"
  ON "Evidence" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "Evidence___nameSort_idx"
  ON "Evidence" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Evidence_predecessor_idx"
  ON "Evidence" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "Evidence_publisher_idx"
  ON "Evidence" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "Evidence___status_idx"
  ON "Evidence" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Evidence_successor_idx"
  ON "Evidence" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "Evidence_title_idx"
  ON "Evidence" USING btree ("title");

CREATE INDEX IF NOT EXISTS "Evidence___topic_idx"
  ON "Evidence" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "Evidence_url_idx"
  ON "Evidence" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Evidence_version_idx"
  ON "Evidence" USING btree ("version");

CREATE INDEX IF NOT EXISTS "Evidence___sharedTokens_idx"
  ON "Evidence" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Evidence___contextText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___contextTypeText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___identifierText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___jurisdictionText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___statusText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___topicText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence____tagText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence___sharedTokensText_trgm_idx"
  ON "Evidence" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Evidence_History_id_idx"
  ON "Evidence_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Evidence_History_lastUpdated_idx"
  ON "Evidence_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Evidence_References_targetId_code_idx"
  ON "Evidence_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_lastUpdated_idx"
  ON "EvidenceVariable" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_projectId_lastUpdated_idx"
  ON "EvidenceVariable" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_projectId_idx"
  ON "EvidenceVariable" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "EvidenceVariable__source_idx"
  ON "EvidenceVariable" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_profile_idx"
  ON "EvidenceVariable" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___version_idx"
  ON "EvidenceVariable" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_reindex_idx"
  ON "EvidenceVariable" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "EvidenceVariable_compartments_idx"
  ON "EvidenceVariable" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_composedOf_idx"
  ON "EvidenceVariable" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___context_idx"
  ON "EvidenceVariable" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_contextQuantity_idx"
  ON "EvidenceVariable" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___contextType_idx"
  ON "EvidenceVariable" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_date_idx"
  ON "EvidenceVariable" USING btree ("date");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_dependsOn_idx"
  ON "EvidenceVariable" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_derivedFrom_idx"
  ON "EvidenceVariable" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_description_idx"
  ON "EvidenceVariable" USING btree ("description");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_effective_idx"
  ON "EvidenceVariable" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___identifier_idx"
  ON "EvidenceVariable" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___jurisdiction_idx"
  ON "EvidenceVariable" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___nameSort_idx"
  ON "EvidenceVariable" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_predecessor_idx"
  ON "EvidenceVariable" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_publisher_idx"
  ON "EvidenceVariable" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___status_idx"
  ON "EvidenceVariable" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_successor_idx"
  ON "EvidenceVariable" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_title_idx"
  ON "EvidenceVariable" USING btree ("title");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___topic_idx"
  ON "EvidenceVariable" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_url_idx"
  ON "EvidenceVariable" USING btree ("url");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_version_idx"
  ON "EvidenceVariable" USING btree ("version");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___sharedTokens_idx"
  ON "EvidenceVariable" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "EvidenceVariable___contextText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___contextTypeText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___identifierText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___jurisdictionText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___statusText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___topicText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable____tagText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable___sharedTokensText_trgm_idx"
  ON "EvidenceVariable" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "EvidenceVariable_History_id_idx"
  ON "EvidenceVariable_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_History_lastUpdated_idx"
  ON "EvidenceVariable_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "EvidenceVariable_References_targetId_code_idx"
  ON "EvidenceVariable_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ExampleScenario_lastUpdated_idx"
  ON "ExampleScenario" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ExampleScenario_projectId_lastUpdated_idx"
  ON "ExampleScenario" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ExampleScenario_projectId_idx"
  ON "ExampleScenario" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ExampleScenario__source_idx"
  ON "ExampleScenario" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ExampleScenario_profile_idx"
  ON "ExampleScenario" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ExampleScenario___version_idx"
  ON "ExampleScenario" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ExampleScenario_reindex_idx"
  ON "ExampleScenario" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ExampleScenario_compartments_idx"
  ON "ExampleScenario" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ExampleScenario___context_idx"
  ON "ExampleScenario" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ExampleScenario_contextQuantity_idx"
  ON "ExampleScenario" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ExampleScenario___contextType_idx"
  ON "ExampleScenario" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ExampleScenario_date_idx"
  ON "ExampleScenario" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ExampleScenario___identifier_idx"
  ON "ExampleScenario" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ExampleScenario___jurisdiction_idx"
  ON "ExampleScenario" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ExampleScenario___nameSort_idx"
  ON "ExampleScenario" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ExampleScenario_publisher_idx"
  ON "ExampleScenario" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ExampleScenario___status_idx"
  ON "ExampleScenario" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ExampleScenario_url_idx"
  ON "ExampleScenario" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ExampleScenario_version_idx"
  ON "ExampleScenario" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ExampleScenario___sharedTokens_idx"
  ON "ExampleScenario" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ExampleScenario___contextText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario___contextTypeText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario___identifierText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario___jurisdictionText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario___statusText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario____tagText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario___sharedTokensText_trgm_idx"
  ON "ExampleScenario" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExampleScenario_History_id_idx"
  ON "ExampleScenario_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ExampleScenario_History_lastUpdated_idx"
  ON "ExampleScenario_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ExampleScenario_References_targetId_code_idx"
  ON "ExampleScenario_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_lastUpdated_idx"
  ON "ExplanationOfBenefit" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_projectId_lastUpdated_idx"
  ON "ExplanationOfBenefit" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_projectId_idx"
  ON "ExplanationOfBenefit" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit__source_idx"
  ON "ExplanationOfBenefit" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_profile_idx"
  ON "ExplanationOfBenefit" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___version_idx"
  ON "ExplanationOfBenefit" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_reindex_idx"
  ON "ExplanationOfBenefit" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_compartments_idx"
  ON "ExplanationOfBenefit" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_careTeam_idx"
  ON "ExplanationOfBenefit" USING gin ("careTeam");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_claim_idx"
  ON "ExplanationOfBenefit" USING btree ("claim");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_coverage_idx"
  ON "ExplanationOfBenefit" USING gin ("coverage");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_created_idx"
  ON "ExplanationOfBenefit" USING btree ("created");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_detailUdi_idx"
  ON "ExplanationOfBenefit" USING gin ("detailUdi");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_disposition_idx"
  ON "ExplanationOfBenefit" USING btree ("disposition");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_encounter_idx"
  ON "ExplanationOfBenefit" USING gin ("encounter");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_enterer_idx"
  ON "ExplanationOfBenefit" USING btree ("enterer");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_facility_idx"
  ON "ExplanationOfBenefit" USING btree ("facility");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___identifier_idx"
  ON "ExplanationOfBenefit" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_itemUdi_idx"
  ON "ExplanationOfBenefit" USING gin ("itemUdi");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_patient_idx"
  ON "ExplanationOfBenefit" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_payee_idx"
  ON "ExplanationOfBenefit" USING btree ("payee");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_procedureUdi_idx"
  ON "ExplanationOfBenefit" USING gin ("procedureUdi");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_provider_idx"
  ON "ExplanationOfBenefit" USING btree ("provider");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___status_idx"
  ON "ExplanationOfBenefit" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_subdetailUdi_idx"
  ON "ExplanationOfBenefit" USING gin ("subdetailUdi");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___sharedTokens_idx"
  ON "ExplanationOfBenefit" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___identifierText_trgm_idx"
  ON "ExplanationOfBenefit" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___statusText_trgm_idx"
  ON "ExplanationOfBenefit" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit____tagText_trgm_idx"
  ON "ExplanationOfBenefit" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit___sharedTokensText_trgm_idx"
  ON "ExplanationOfBenefit" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_History_id_idx"
  ON "ExplanationOfBenefit_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_History_lastUpdated_idx"
  ON "ExplanationOfBenefit_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ExplanationOfBenefit_References_targetId_code_idx"
  ON "ExplanationOfBenefit_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_lastUpdated_idx"
  ON "FamilyMemberHistory" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_projectId_lastUpdated_idx"
  ON "FamilyMemberHistory" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_projectId_idx"
  ON "FamilyMemberHistory" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory__source_idx"
  ON "FamilyMemberHistory" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_profile_idx"
  ON "FamilyMemberHistory" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___version_idx"
  ON "FamilyMemberHistory" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_reindex_idx"
  ON "FamilyMemberHistory" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_compartments_idx"
  ON "FamilyMemberHistory" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___code_idx"
  ON "FamilyMemberHistory" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_date_idx"
  ON "FamilyMemberHistory" USING btree ("date");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___identifier_idx"
  ON "FamilyMemberHistory" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_instantiatesCanonical_idx"
  ON "FamilyMemberHistory" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_instantiatesUri_idx"
  ON "FamilyMemberHistory" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_patient_idx"
  ON "FamilyMemberHistory" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___relationship_idx"
  ON "FamilyMemberHistory" USING gin ("__relationship");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___sex_idx"
  ON "FamilyMemberHistory" USING gin ("__sex");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___status_idx"
  ON "FamilyMemberHistory" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___sharedTokens_idx"
  ON "FamilyMemberHistory" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___codeText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___identifierText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___relationshipText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__relationshipText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___sexText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__sexText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___statusText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory____tagText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory___sharedTokensText_trgm_idx"
  ON "FamilyMemberHistory" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_History_id_idx"
  ON "FamilyMemberHistory_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_History_lastUpdated_idx"
  ON "FamilyMemberHistory_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "FamilyMemberHistory_References_targetId_code_idx"
  ON "FamilyMemberHistory_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Flag_lastUpdated_idx"
  ON "Flag" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Flag_projectId_lastUpdated_idx"
  ON "Flag" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Flag_projectId_idx"
  ON "Flag" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Flag__source_idx"
  ON "Flag" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Flag_profile_idx"
  ON "Flag" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Flag___version_idx"
  ON "Flag" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Flag_reindex_idx"
  ON "Flag" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Flag_compartments_idx"
  ON "Flag" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Flag_author_idx"
  ON "Flag" USING btree ("author");

CREATE INDEX IF NOT EXISTS "Flag_date_idx"
  ON "Flag" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Flag_encounter_idx"
  ON "Flag" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Flag___identifier_idx"
  ON "Flag" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Flag_patient_idx"
  ON "Flag" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Flag_subject_idx"
  ON "Flag" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Flag___sharedTokens_idx"
  ON "Flag" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Flag___identifierText_trgm_idx"
  ON "Flag" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Flag____tagText_trgm_idx"
  ON "Flag" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Flag___sharedTokensText_trgm_idx"
  ON "Flag" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Flag_History_id_idx"
  ON "Flag_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Flag_History_lastUpdated_idx"
  ON "Flag_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Flag_References_targetId_code_idx"
  ON "Flag_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Goal_lastUpdated_idx"
  ON "Goal" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Goal_projectId_lastUpdated_idx"
  ON "Goal" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Goal_projectId_idx"
  ON "Goal" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Goal__source_idx"
  ON "Goal" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Goal_profile_idx"
  ON "Goal" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Goal___version_idx"
  ON "Goal" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Goal_reindex_idx"
  ON "Goal" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Goal_compartments_idx"
  ON "Goal" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Goal___achievementStatus_idx"
  ON "Goal" USING gin ("__achievementStatus");

CREATE INDEX IF NOT EXISTS "Goal___category_idx"
  ON "Goal" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Goal___identifier_idx"
  ON "Goal" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Goal___lifecycleStatus_idx"
  ON "Goal" USING gin ("__lifecycleStatus");

CREATE INDEX IF NOT EXISTS "Goal_patient_idx"
  ON "Goal" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Goal_startDate_idx"
  ON "Goal" USING btree ("startDate");

CREATE INDEX IF NOT EXISTS "Goal_subject_idx"
  ON "Goal" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Goal_targetDate_idx"
  ON "Goal" USING gin ("targetDate");

CREATE INDEX IF NOT EXISTS "Goal___sharedTokens_idx"
  ON "Goal" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Goal___achievementStatusText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("__achievementStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal___categoryText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal___identifierText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal___lifecycleStatusText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("__lifecycleStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal____tagText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal___sharedTokensText_trgm_idx"
  ON "Goal" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Goal_History_id_idx"
  ON "Goal_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Goal_History_lastUpdated_idx"
  ON "Goal_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Goal_References_targetId_code_idx"
  ON "Goal_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "GraphDefinition_lastUpdated_idx"
  ON "GraphDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "GraphDefinition_projectId_lastUpdated_idx"
  ON "GraphDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "GraphDefinition_projectId_idx"
  ON "GraphDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "GraphDefinition__source_idx"
  ON "GraphDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "GraphDefinition_profile_idx"
  ON "GraphDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "GraphDefinition___version_idx"
  ON "GraphDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "GraphDefinition_reindex_idx"
  ON "GraphDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "GraphDefinition_compartments_idx"
  ON "GraphDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "GraphDefinition___context_idx"
  ON "GraphDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "GraphDefinition_contextQuantity_idx"
  ON "GraphDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "GraphDefinition___contextType_idx"
  ON "GraphDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "GraphDefinition_date_idx"
  ON "GraphDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "GraphDefinition_description_idx"
  ON "GraphDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "GraphDefinition___jurisdiction_idx"
  ON "GraphDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "GraphDefinition___nameSort_idx"
  ON "GraphDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "GraphDefinition_publisher_idx"
  ON "GraphDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "GraphDefinition___start_idx"
  ON "GraphDefinition" USING gin ("__start");

CREATE INDEX IF NOT EXISTS "GraphDefinition___status_idx"
  ON "GraphDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "GraphDefinition_url_idx"
  ON "GraphDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "GraphDefinition_version_idx"
  ON "GraphDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "GraphDefinition___sharedTokens_idx"
  ON "GraphDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "GraphDefinition___contextText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition___contextTypeText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition___jurisdictionText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition___startText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__startText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition___statusText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition____tagText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition___sharedTokensText_trgm_idx"
  ON "GraphDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GraphDefinition_History_id_idx"
  ON "GraphDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "GraphDefinition_History_lastUpdated_idx"
  ON "GraphDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "GraphDefinition_References_targetId_code_idx"
  ON "GraphDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Group_lastUpdated_idx"
  ON "Group" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Group_projectId_lastUpdated_idx"
  ON "Group" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Group_projectId_idx"
  ON "Group" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Group__source_idx"
  ON "Group" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Group_profile_idx"
  ON "Group" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Group___version_idx"
  ON "Group" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Group_reindex_idx"
  ON "Group" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Group_compartments_idx"
  ON "Group" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Group___actual_idx"
  ON "Group" USING gin ("__actual");

CREATE INDEX IF NOT EXISTS "Group___characteristic_idx"
  ON "Group" USING gin ("__characteristic");

CREATE INDEX IF NOT EXISTS "Group___code_idx"
  ON "Group" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Group___exclude_idx"
  ON "Group" USING gin ("__exclude");

CREATE INDEX IF NOT EXISTS "Group___identifier_idx"
  ON "Group" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Group_managingEntity_idx"
  ON "Group" USING btree ("managingEntity");

CREATE INDEX IF NOT EXISTS "Group_member_idx"
  ON "Group" USING gin ("member");

CREATE INDEX IF NOT EXISTS "Group___type_idx"
  ON "Group" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Group___value_idx"
  ON "Group" USING gin ("__value");

CREATE INDEX IF NOT EXISTS "Group___sharedTokens_idx"
  ON "Group" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Group___actualText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__actualText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___characteristicText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__characteristicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___codeText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___excludeText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__excludeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___identifierText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___typeText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___valueText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__valueText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group____tagText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group___sharedTokensText_trgm_idx"
  ON "Group" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Group_History_id_idx"
  ON "Group_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Group_History_lastUpdated_idx"
  ON "Group_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Group_References_targetId_code_idx"
  ON "Group_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_lastUpdated_idx"
  ON "GuidanceResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_projectId_lastUpdated_idx"
  ON "GuidanceResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_projectId_idx"
  ON "GuidanceResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "GuidanceResponse__source_idx"
  ON "GuidanceResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_profile_idx"
  ON "GuidanceResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "GuidanceResponse___version_idx"
  ON "GuidanceResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_reindex_idx"
  ON "GuidanceResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "GuidanceResponse_compartments_idx"
  ON "GuidanceResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "GuidanceResponse___identifier_idx"
  ON "GuidanceResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_patient_idx"
  ON "GuidanceResponse" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "GuidanceResponse___request_idx"
  ON "GuidanceResponse" USING gin ("__request");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_subject_idx"
  ON "GuidanceResponse" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "GuidanceResponse___sharedTokens_idx"
  ON "GuidanceResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "GuidanceResponse___identifierText_trgm_idx"
  ON "GuidanceResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GuidanceResponse___requestText_trgm_idx"
  ON "GuidanceResponse" USING gin (token_array_to_text("__requestText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GuidanceResponse____tagText_trgm_idx"
  ON "GuidanceResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GuidanceResponse___sharedTokensText_trgm_idx"
  ON "GuidanceResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "GuidanceResponse_History_id_idx"
  ON "GuidanceResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_History_lastUpdated_idx"
  ON "GuidanceResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "GuidanceResponse_References_targetId_code_idx"
  ON "GuidanceResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "HealthcareService_lastUpdated_idx"
  ON "HealthcareService" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "HealthcareService_projectId_lastUpdated_idx"
  ON "HealthcareService" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "HealthcareService_projectId_idx"
  ON "HealthcareService" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "HealthcareService__source_idx"
  ON "HealthcareService" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "HealthcareService_profile_idx"
  ON "HealthcareService" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "HealthcareService___version_idx"
  ON "HealthcareService" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "HealthcareService_reindex_idx"
  ON "HealthcareService" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "HealthcareService_compartments_idx"
  ON "HealthcareService" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "HealthcareService___active_idx"
  ON "HealthcareService" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "HealthcareService___characteristic_idx"
  ON "HealthcareService" USING gin ("__characteristic");

CREATE INDEX IF NOT EXISTS "HealthcareService_coverageArea_idx"
  ON "HealthcareService" USING gin ("coverageArea");

CREATE INDEX IF NOT EXISTS "HealthcareService_endpoint_idx"
  ON "HealthcareService" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "HealthcareService___identifier_idx"
  ON "HealthcareService" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "HealthcareService_location_idx"
  ON "HealthcareService" USING gin ("location");

CREATE INDEX IF NOT EXISTS "HealthcareService___nameSort_idx"
  ON "HealthcareService" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "HealthcareService_organization_idx"
  ON "HealthcareService" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "HealthcareService___program_idx"
  ON "HealthcareService" USING gin ("__program");

CREATE INDEX IF NOT EXISTS "HealthcareService___serviceCategory_idx"
  ON "HealthcareService" USING gin ("__serviceCategory");

CREATE INDEX IF NOT EXISTS "HealthcareService___serviceType_idx"
  ON "HealthcareService" USING gin ("__serviceType");

CREATE INDEX IF NOT EXISTS "HealthcareService___specialty_idx"
  ON "HealthcareService" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "HealthcareService___sharedTokens_idx"
  ON "HealthcareService" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "HealthcareService___activeText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___characteristicText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__characteristicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___identifierText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___programText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__programText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___serviceCategoryText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__serviceCategoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___serviceTypeText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__serviceTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___specialtyText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService____tagText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService___sharedTokensText_trgm_idx"
  ON "HealthcareService" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "HealthcareService_History_id_idx"
  ON "HealthcareService_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "HealthcareService_History_lastUpdated_idx"
  ON "HealthcareService_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "HealthcareService_References_targetId_code_idx"
  ON "HealthcareService_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ImagingStudy_lastUpdated_idx"
  ON "ImagingStudy" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImagingStudy_projectId_lastUpdated_idx"
  ON "ImagingStudy" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ImagingStudy_projectId_idx"
  ON "ImagingStudy" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ImagingStudy__source_idx"
  ON "ImagingStudy" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ImagingStudy_profile_idx"
  ON "ImagingStudy" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ImagingStudy___version_idx"
  ON "ImagingStudy" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ImagingStudy_reindex_idx"
  ON "ImagingStudy" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ImagingStudy_compartments_idx"
  ON "ImagingStudy" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ImagingStudy_basedon_idx"
  ON "ImagingStudy" USING gin ("basedon");

CREATE INDEX IF NOT EXISTS "ImagingStudy___bodysite_idx"
  ON "ImagingStudy" USING gin ("__bodysite");

CREATE INDEX IF NOT EXISTS "ImagingStudy___dicomClass_idx"
  ON "ImagingStudy" USING gin ("__dicomClass");

CREATE INDEX IF NOT EXISTS "ImagingStudy_encounter_idx"
  ON "ImagingStudy" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "ImagingStudy_endpoint_idx"
  ON "ImagingStudy" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "ImagingStudy___identifier_idx"
  ON "ImagingStudy" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ImagingStudy___instance_idx"
  ON "ImagingStudy" USING gin ("__instance");

CREATE INDEX IF NOT EXISTS "ImagingStudy_interpreter_idx"
  ON "ImagingStudy" USING gin ("interpreter");

CREATE INDEX IF NOT EXISTS "ImagingStudy___modality_idx"
  ON "ImagingStudy" USING gin ("__modality");

CREATE INDEX IF NOT EXISTS "ImagingStudy_patient_idx"
  ON "ImagingStudy" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ImagingStudy_performer_idx"
  ON "ImagingStudy" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "ImagingStudy___reason_idx"
  ON "ImagingStudy" USING gin ("__reason");

CREATE INDEX IF NOT EXISTS "ImagingStudy_referrer_idx"
  ON "ImagingStudy" USING btree ("referrer");

CREATE INDEX IF NOT EXISTS "ImagingStudy___series_idx"
  ON "ImagingStudy" USING gin ("__series");

CREATE INDEX IF NOT EXISTS "ImagingStudy_started_idx"
  ON "ImagingStudy" USING btree ("started");

CREATE INDEX IF NOT EXISTS "ImagingStudy___status_idx"
  ON "ImagingStudy" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ImagingStudy_subject_idx"
  ON "ImagingStudy" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "ImagingStudy___sharedTokens_idx"
  ON "ImagingStudy" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ImagingStudy___bodysiteText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__bodysiteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___dicomClassText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__dicomClassText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___identifierText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___instanceText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__instanceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___modalityText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__modalityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___reasonText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__reasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___seriesText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__seriesText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___statusText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy____tagText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy___sharedTokensText_trgm_idx"
  ON "ImagingStudy" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImagingStudy_History_id_idx"
  ON "ImagingStudy_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ImagingStudy_History_lastUpdated_idx"
  ON "ImagingStudy_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImagingStudy_References_targetId_code_idx"
  ON "ImagingStudy_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Immunization_lastUpdated_idx"
  ON "Immunization" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Immunization_projectId_lastUpdated_idx"
  ON "Immunization" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Immunization_projectId_idx"
  ON "Immunization" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Immunization__source_idx"
  ON "Immunization" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Immunization_profile_idx"
  ON "Immunization" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Immunization___version_idx"
  ON "Immunization" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Immunization_reindex_idx"
  ON "Immunization" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Immunization_compartments_idx"
  ON "Immunization" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Immunization_date_idx"
  ON "Immunization" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Immunization___identifier_idx"
  ON "Immunization" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Immunization_location_idx"
  ON "Immunization" USING btree ("location");

CREATE INDEX IF NOT EXISTS "Immunization_lotNumber_idx"
  ON "Immunization" USING btree ("lotNumber");

CREATE INDEX IF NOT EXISTS "Immunization_manufacturer_idx"
  ON "Immunization" USING btree ("manufacturer");

CREATE INDEX IF NOT EXISTS "Immunization_patient_idx"
  ON "Immunization" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Immunization_performer_idx"
  ON "Immunization" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "Immunization_reaction_idx"
  ON "Immunization" USING gin ("reaction");

CREATE INDEX IF NOT EXISTS "Immunization_reactionDate_idx"
  ON "Immunization" USING gin ("reactionDate");

CREATE INDEX IF NOT EXISTS "Immunization___reasonCode_idx"
  ON "Immunization" USING gin ("__reasonCode");

CREATE INDEX IF NOT EXISTS "Immunization_reasonReference_idx"
  ON "Immunization" USING gin ("reasonReference");

CREATE INDEX IF NOT EXISTS "Immunization_series_idx"
  ON "Immunization" USING gin ("series");

CREATE INDEX IF NOT EXISTS "Immunization___status_idx"
  ON "Immunization" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Immunization___statusReason_idx"
  ON "Immunization" USING gin ("__statusReason");

CREATE INDEX IF NOT EXISTS "Immunization___targetDisease_idx"
  ON "Immunization" USING gin ("__targetDisease");

CREATE INDEX IF NOT EXISTS "Immunization___vaccineCode_idx"
  ON "Immunization" USING gin ("__vaccineCode");

CREATE INDEX IF NOT EXISTS "Immunization___sharedTokens_idx"
  ON "Immunization" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Immunization___identifierText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___reasonCodeText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__reasonCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___statusText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___statusReasonText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__statusReasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___targetDiseaseText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__targetDiseaseText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___vaccineCodeText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__vaccineCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization____tagText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization___sharedTokensText_trgm_idx"
  ON "Immunization" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Immunization_History_id_idx"
  ON "Immunization_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Immunization_History_lastUpdated_idx"
  ON "Immunization_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Immunization_References_targetId_code_idx"
  ON "Immunization_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_lastUpdated_idx"
  ON "ImmunizationEvaluation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_projectId_lastUpdated_idx"
  ON "ImmunizationEvaluation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_projectId_idx"
  ON "ImmunizationEvaluation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation__source_idx"
  ON "ImmunizationEvaluation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_profile_idx"
  ON "ImmunizationEvaluation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___version_idx"
  ON "ImmunizationEvaluation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_reindex_idx"
  ON "ImmunizationEvaluation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_compartments_idx"
  ON "ImmunizationEvaluation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_date_idx"
  ON "ImmunizationEvaluation" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___doseStatus_idx"
  ON "ImmunizationEvaluation" USING gin ("__doseStatus");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___identifier_idx"
  ON "ImmunizationEvaluation" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_immunizationEvent_idx"
  ON "ImmunizationEvaluation" USING btree ("immunizationEvent");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_patient_idx"
  ON "ImmunizationEvaluation" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___status_idx"
  ON "ImmunizationEvaluation" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___targetDisease_idx"
  ON "ImmunizationEvaluation" USING gin ("__targetDisease");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___sharedTokens_idx"
  ON "ImmunizationEvaluation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___doseStatusText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("__doseStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___identifierText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___statusText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___targetDiseaseText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("__targetDiseaseText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation____tagText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation___sharedTokensText_trgm_idx"
  ON "ImmunizationEvaluation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_History_id_idx"
  ON "ImmunizationEvaluation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_History_lastUpdated_idx"
  ON "ImmunizationEvaluation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationEvaluation_References_targetId_code_idx"
  ON "ImmunizationEvaluation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_lastUpdated_idx"
  ON "ImmunizationRecommendation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_projectId_lastUpdated_idx"
  ON "ImmunizationRecommendation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_projectId_idx"
  ON "ImmunizationRecommendation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation__source_idx"
  ON "ImmunizationRecommendation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_profile_idx"
  ON "ImmunizationRecommendation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___version_idx"
  ON "ImmunizationRecommendation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_reindex_idx"
  ON "ImmunizationRecommendation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_compartments_idx"
  ON "ImmunizationRecommendation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_date_idx"
  ON "ImmunizationRecommendation" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___identifier_idx"
  ON "ImmunizationRecommendation" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_information_idx"
  ON "ImmunizationRecommendation" USING gin ("information");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_patient_idx"
  ON "ImmunizationRecommendation" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___status_idx"
  ON "ImmunizationRecommendation" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_support_idx"
  ON "ImmunizationRecommendation" USING gin ("support");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___targetDisease_idx"
  ON "ImmunizationRecommendation" USING gin ("__targetDisease");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___vaccineType_idx"
  ON "ImmunizationRecommendation" USING gin ("__vaccineType");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___sharedTokens_idx"
  ON "ImmunizationRecommendation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___identifierText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___statusText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___targetDiseaseText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("__targetDiseaseText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___vaccineTypeText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("__vaccineTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation____tagText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation___sharedTokensText_trgm_idx"
  ON "ImmunizationRecommendation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_History_id_idx"
  ON "ImmunizationRecommendation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_History_lastUpdated_idx"
  ON "ImmunizationRecommendation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImmunizationRecommendation_References_targetId_code_idx"
  ON "ImmunizationRecommendation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_lastUpdated_idx"
  ON "ImplementationGuide" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_projectId_lastUpdated_idx"
  ON "ImplementationGuide" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_projectId_idx"
  ON "ImplementationGuide" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ImplementationGuide__source_idx"
  ON "ImplementationGuide" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_profile_idx"
  ON "ImplementationGuide" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___version_idx"
  ON "ImplementationGuide" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_reindex_idx"
  ON "ImplementationGuide" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ImplementationGuide_compartments_idx"
  ON "ImplementationGuide" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___context_idx"
  ON "ImplementationGuide" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_contextQuantity_idx"
  ON "ImplementationGuide" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___contextType_idx"
  ON "ImplementationGuide" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_date_idx"
  ON "ImplementationGuide" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_dependsOn_idx"
  ON "ImplementationGuide" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_description_idx"
  ON "ImplementationGuide" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___experimental_idx"
  ON "ImplementationGuide" USING gin ("__experimental");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_global_idx"
  ON "ImplementationGuide" USING gin ("global");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___jurisdiction_idx"
  ON "ImplementationGuide" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___nameSort_idx"
  ON "ImplementationGuide" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_publisher_idx"
  ON "ImplementationGuide" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_resource_idx"
  ON "ImplementationGuide" USING gin ("resource");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___status_idx"
  ON "ImplementationGuide" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_title_idx"
  ON "ImplementationGuide" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_url_idx"
  ON "ImplementationGuide" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_version_idx"
  ON "ImplementationGuide" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___sharedTokens_idx"
  ON "ImplementationGuide" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ImplementationGuide___contextText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide___contextTypeText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide___experimentalText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__experimentalText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide___jurisdictionText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide___statusText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide____tagText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide___sharedTokensText_trgm_idx"
  ON "ImplementationGuide" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ImplementationGuide_History_id_idx"
  ON "ImplementationGuide_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_History_lastUpdated_idx"
  ON "ImplementationGuide_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ImplementationGuide_References_targetId_code_idx"
  ON "ImplementationGuide_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "InsurancePlan_lastUpdated_idx"
  ON "InsurancePlan" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "InsurancePlan_projectId_lastUpdated_idx"
  ON "InsurancePlan" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "InsurancePlan_projectId_idx"
  ON "InsurancePlan" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "InsurancePlan__source_idx"
  ON "InsurancePlan" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "InsurancePlan_profile_idx"
  ON "InsurancePlan" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "InsurancePlan___version_idx"
  ON "InsurancePlan" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "InsurancePlan_reindex_idx"
  ON "InsurancePlan" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "InsurancePlan_compartments_idx"
  ON "InsurancePlan" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressSort_idx"
  ON "InsurancePlan" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressCitySort_idx"
  ON "InsurancePlan" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressCountrySort_idx"
  ON "InsurancePlan" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressPostalcodeSort_idx"
  ON "InsurancePlan" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressStateSort_idx"
  ON "InsurancePlan" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___addressUseSort_idx"
  ON "InsurancePlan" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "InsurancePlan_administeredBy_idx"
  ON "InsurancePlan" USING btree ("administeredBy");

CREATE INDEX IF NOT EXISTS "InsurancePlan_endpoint_idx"
  ON "InsurancePlan" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "InsurancePlan___identifier_idx"
  ON "InsurancePlan" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "InsurancePlan_name_idx"
  ON "InsurancePlan" USING btree ("name");

CREATE INDEX IF NOT EXISTS "InsurancePlan_ownedBy_idx"
  ON "InsurancePlan" USING btree ("ownedBy");

CREATE INDEX IF NOT EXISTS "InsurancePlan___phoneticSort_idx"
  ON "InsurancePlan" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "InsurancePlan___status_idx"
  ON "InsurancePlan" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "InsurancePlan___type_idx"
  ON "InsurancePlan" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "InsurancePlan___sharedTokens_idx"
  ON "InsurancePlan" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "InsurancePlan___identifierText_trgm_idx"
  ON "InsurancePlan" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "InsurancePlan___statusText_trgm_idx"
  ON "InsurancePlan" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "InsurancePlan___typeText_trgm_idx"
  ON "InsurancePlan" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "InsurancePlan____tagText_trgm_idx"
  ON "InsurancePlan" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "InsurancePlan___sharedTokensText_trgm_idx"
  ON "InsurancePlan" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "InsurancePlan_History_id_idx"
  ON "InsurancePlan_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "InsurancePlan_History_lastUpdated_idx"
  ON "InsurancePlan_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "InsurancePlan_References_targetId_code_idx"
  ON "InsurancePlan_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Invoice_lastUpdated_idx"
  ON "Invoice" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Invoice_projectId_lastUpdated_idx"
  ON "Invoice" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx"
  ON "Invoice" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Invoice__source_idx"
  ON "Invoice" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Invoice_profile_idx"
  ON "Invoice" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Invoice___version_idx"
  ON "Invoice" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Invoice_reindex_idx"
  ON "Invoice" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Invoice_compartments_idx"
  ON "Invoice" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Invoice_account_idx"
  ON "Invoice" USING btree ("account");

CREATE INDEX IF NOT EXISTS "Invoice_date_idx"
  ON "Invoice" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Invoice___identifier_idx"
  ON "Invoice" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Invoice_issuer_idx"
  ON "Invoice" USING btree ("issuer");

CREATE INDEX IF NOT EXISTS "Invoice_participant_idx"
  ON "Invoice" USING gin ("participant");

CREATE INDEX IF NOT EXISTS "Invoice___participantRole_idx"
  ON "Invoice" USING gin ("__participantRole");

CREATE INDEX IF NOT EXISTS "Invoice_patient_idx"
  ON "Invoice" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Invoice_recipient_idx"
  ON "Invoice" USING btree ("recipient");

CREATE INDEX IF NOT EXISTS "Invoice___status_idx"
  ON "Invoice" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Invoice_subject_idx"
  ON "Invoice" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Invoice_totalgross_idx"
  ON "Invoice" USING btree ("totalgross");

CREATE INDEX IF NOT EXISTS "Invoice_totalnet_idx"
  ON "Invoice" USING btree ("totalnet");

CREATE INDEX IF NOT EXISTS "Invoice___type_idx"
  ON "Invoice" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Invoice___sharedTokens_idx"
  ON "Invoice" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Invoice___identifierText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice___participantRoleText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("__participantRoleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice___statusText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice___typeText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice____tagText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice___sharedTokensText_trgm_idx"
  ON "Invoice" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Invoice_History_id_idx"
  ON "Invoice_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Invoice_History_lastUpdated_idx"
  ON "Invoice_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Invoice_References_targetId_code_idx"
  ON "Invoice_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Library_lastUpdated_idx"
  ON "Library" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Library_projectId_lastUpdated_idx"
  ON "Library" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Library_projectId_idx"
  ON "Library" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Library__source_idx"
  ON "Library" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Library_profile_idx"
  ON "Library" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Library___version_idx"
  ON "Library" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Library_reindex_idx"
  ON "Library" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Library_compartments_idx"
  ON "Library" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Library_composedOf_idx"
  ON "Library" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "Library___contentType_idx"
  ON "Library" USING gin ("__contentType");

CREATE INDEX IF NOT EXISTS "Library___context_idx"
  ON "Library" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "Library_contextQuantity_idx"
  ON "Library" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "Library___contextType_idx"
  ON "Library" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "Library_date_idx"
  ON "Library" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Library_dependsOn_idx"
  ON "Library" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "Library_derivedFrom_idx"
  ON "Library" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "Library_description_idx"
  ON "Library" USING btree ("description");

CREATE INDEX IF NOT EXISTS "Library_effective_idx"
  ON "Library" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "Library___identifier_idx"
  ON "Library" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Library___jurisdiction_idx"
  ON "Library" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "Library___nameSort_idx"
  ON "Library" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Library_predecessor_idx"
  ON "Library" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "Library_publisher_idx"
  ON "Library" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "Library___status_idx"
  ON "Library" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Library_successor_idx"
  ON "Library" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "Library_title_idx"
  ON "Library" USING btree ("title");

CREATE INDEX IF NOT EXISTS "Library___topic_idx"
  ON "Library" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "Library___type_idx"
  ON "Library" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Library_url_idx"
  ON "Library" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Library_version_idx"
  ON "Library" USING btree ("version");

CREATE INDEX IF NOT EXISTS "Library___sharedTokens_idx"
  ON "Library" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Library___contentTypeText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__contentTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___contextText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___contextTypeText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___identifierText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___jurisdictionText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___statusText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___topicText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___typeText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library____tagText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library___sharedTokensText_trgm_idx"
  ON "Library" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Library_History_id_idx"
  ON "Library_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Library_History_lastUpdated_idx"
  ON "Library_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Library_References_targetId_code_idx"
  ON "Library_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Linkage_lastUpdated_idx"
  ON "Linkage" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Linkage_projectId_lastUpdated_idx"
  ON "Linkage" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Linkage_projectId_idx"
  ON "Linkage" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Linkage__source_idx"
  ON "Linkage" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Linkage_profile_idx"
  ON "Linkage" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Linkage___version_idx"
  ON "Linkage" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Linkage_reindex_idx"
  ON "Linkage" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Linkage_compartments_idx"
  ON "Linkage" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Linkage_author_idx"
  ON "Linkage" USING btree ("author");

CREATE INDEX IF NOT EXISTS "Linkage_item_idx"
  ON "Linkage" USING gin ("item");

CREATE INDEX IF NOT EXISTS "Linkage_source_idx"
  ON "Linkage" USING gin ("source");

CREATE INDEX IF NOT EXISTS "Linkage___sharedTokens_idx"
  ON "Linkage" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Linkage____tagText_trgm_idx"
  ON "Linkage" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Linkage___sharedTokensText_trgm_idx"
  ON "Linkage" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Linkage_History_id_idx"
  ON "Linkage_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Linkage_History_lastUpdated_idx"
  ON "Linkage_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Linkage_References_targetId_code_idx"
  ON "Linkage_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "List_lastUpdated_idx"
  ON "List" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "List_projectId_lastUpdated_idx"
  ON "List" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "List_projectId_idx"
  ON "List" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "List__source_idx"
  ON "List" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "List_profile_idx"
  ON "List" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "List___version_idx"
  ON "List" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "List_reindex_idx"
  ON "List" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "List_compartments_idx"
  ON "List" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "List___code_idx"
  ON "List" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "List_date_idx"
  ON "List" USING btree ("date");

CREATE INDEX IF NOT EXISTS "List___emptyReason_idx"
  ON "List" USING gin ("__emptyReason");

CREATE INDEX IF NOT EXISTS "List_encounter_idx"
  ON "List" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "List___identifier_idx"
  ON "List" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "List_item_idx"
  ON "List" USING gin ("item");

CREATE INDEX IF NOT EXISTS "List_notes_idx"
  ON "List" USING gin ("notes");

CREATE INDEX IF NOT EXISTS "List_patient_idx"
  ON "List" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "List_source_idx"
  ON "List" USING btree ("source");

CREATE INDEX IF NOT EXISTS "List___status_idx"
  ON "List" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "List_subject_idx"
  ON "List" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "List_title_idx"
  ON "List" USING btree ("title");

CREATE INDEX IF NOT EXISTS "List___sharedTokens_idx"
  ON "List" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "List___codeText_trgm_idx"
  ON "List" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List___emptyReasonText_trgm_idx"
  ON "List" USING gin (token_array_to_text("__emptyReasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List___identifierText_trgm_idx"
  ON "List" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List___statusText_trgm_idx"
  ON "List" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List____tagText_trgm_idx"
  ON "List" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List___sharedTokensText_trgm_idx"
  ON "List" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "List_History_id_idx"
  ON "List_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "List_History_lastUpdated_idx"
  ON "List_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "List_References_targetId_code_idx"
  ON "List_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Location_lastUpdated_idx"
  ON "Location" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Location_projectId_lastUpdated_idx"
  ON "Location" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Location_projectId_idx"
  ON "Location" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Location__source_idx"
  ON "Location" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Location_profile_idx"
  ON "Location" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Location___version_idx"
  ON "Location" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Location_reindex_idx"
  ON "Location" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Location_compartments_idx"
  ON "Location" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Location___addressSort_idx"
  ON "Location" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "Location___addressCitySort_idx"
  ON "Location" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "Location___addressCountrySort_idx"
  ON "Location" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "Location___addressPostalcodeSort_idx"
  ON "Location" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "Location___addressStateSort_idx"
  ON "Location" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "Location___addressUseSort_idx"
  ON "Location" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "Location_endpoint_idx"
  ON "Location" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "Location___identifier_idx"
  ON "Location" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Location___nameSort_idx"
  ON "Location" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Location___operationalStatus_idx"
  ON "Location" USING gin ("__operationalStatus");

CREATE INDEX IF NOT EXISTS "Location_organization_idx"
  ON "Location" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "Location_partof_idx"
  ON "Location" USING btree ("partof");

CREATE INDEX IF NOT EXISTS "Location___status_idx"
  ON "Location" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Location___type_idx"
  ON "Location" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Location___sharedTokens_idx"
  ON "Location" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Location___identifierText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location___operationalStatusText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("__operationalStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location___statusText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location___typeText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location____tagText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location___sharedTokensText_trgm_idx"
  ON "Location" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Location_History_id_idx"
  ON "Location_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Location_History_lastUpdated_idx"
  ON "Location_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Location_References_targetId_code_idx"
  ON "Location_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Measure_lastUpdated_idx"
  ON "Measure" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Measure_projectId_lastUpdated_idx"
  ON "Measure" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Measure_projectId_idx"
  ON "Measure" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Measure__source_idx"
  ON "Measure" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Measure_profile_idx"
  ON "Measure" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Measure___version_idx"
  ON "Measure" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Measure_reindex_idx"
  ON "Measure" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Measure_compartments_idx"
  ON "Measure" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Measure_composedOf_idx"
  ON "Measure" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "Measure___context_idx"
  ON "Measure" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "Measure_contextQuantity_idx"
  ON "Measure" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "Measure___contextType_idx"
  ON "Measure" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "Measure_date_idx"
  ON "Measure" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Measure_dependsOn_idx"
  ON "Measure" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "Measure_derivedFrom_idx"
  ON "Measure" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "Measure_description_idx"
  ON "Measure" USING btree ("description");

CREATE INDEX IF NOT EXISTS "Measure_effective_idx"
  ON "Measure" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "Measure___identifier_idx"
  ON "Measure" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Measure___jurisdiction_idx"
  ON "Measure" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "Measure___nameSort_idx"
  ON "Measure" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Measure_predecessor_idx"
  ON "Measure" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "Measure_publisher_idx"
  ON "Measure" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "Measure___status_idx"
  ON "Measure" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Measure_successor_idx"
  ON "Measure" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "Measure_title_idx"
  ON "Measure" USING btree ("title");

CREATE INDEX IF NOT EXISTS "Measure___topic_idx"
  ON "Measure" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "Measure_url_idx"
  ON "Measure" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Measure_version_idx"
  ON "Measure" USING btree ("version");

CREATE INDEX IF NOT EXISTS "Measure___sharedTokens_idx"
  ON "Measure" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Measure___contextText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___contextTypeText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___identifierText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___jurisdictionText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___statusText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___topicText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure____tagText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure___sharedTokensText_trgm_idx"
  ON "Measure" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Measure_History_id_idx"
  ON "Measure_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Measure_History_lastUpdated_idx"
  ON "Measure_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Measure_References_targetId_code_idx"
  ON "Measure_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MeasureReport_lastUpdated_idx"
  ON "MeasureReport" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MeasureReport_projectId_lastUpdated_idx"
  ON "MeasureReport" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MeasureReport_projectId_idx"
  ON "MeasureReport" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MeasureReport__source_idx"
  ON "MeasureReport" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MeasureReport_profile_idx"
  ON "MeasureReport" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MeasureReport___version_idx"
  ON "MeasureReport" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MeasureReport_reindex_idx"
  ON "MeasureReport" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MeasureReport_compartments_idx"
  ON "MeasureReport" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MeasureReport_date_idx"
  ON "MeasureReport" USING btree ("date");

CREATE INDEX IF NOT EXISTS "MeasureReport_evaluatedResource_idx"
  ON "MeasureReport" USING gin ("evaluatedResource");

CREATE INDEX IF NOT EXISTS "MeasureReport___identifier_idx"
  ON "MeasureReport" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MeasureReport_measure_idx"
  ON "MeasureReport" USING btree ("measure");

CREATE INDEX IF NOT EXISTS "MeasureReport_patient_idx"
  ON "MeasureReport" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MeasureReport_period_idx"
  ON "MeasureReport" USING btree ("period");

CREATE INDEX IF NOT EXISTS "MeasureReport_reporter_idx"
  ON "MeasureReport" USING btree ("reporter");

CREATE INDEX IF NOT EXISTS "MeasureReport___status_idx"
  ON "MeasureReport" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MeasureReport_subject_idx"
  ON "MeasureReport" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MeasureReport___sharedTokens_idx"
  ON "MeasureReport" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MeasureReport___identifierText_trgm_idx"
  ON "MeasureReport" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MeasureReport___statusText_trgm_idx"
  ON "MeasureReport" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MeasureReport____tagText_trgm_idx"
  ON "MeasureReport" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MeasureReport___sharedTokensText_trgm_idx"
  ON "MeasureReport" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MeasureReport_History_id_idx"
  ON "MeasureReport_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MeasureReport_History_lastUpdated_idx"
  ON "MeasureReport_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MeasureReport_References_targetId_code_idx"
  ON "MeasureReport_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Media_lastUpdated_idx"
  ON "Media" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Media_projectId_lastUpdated_idx"
  ON "Media" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Media_projectId_idx"
  ON "Media" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Media__source_idx"
  ON "Media" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Media_profile_idx"
  ON "Media" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Media___version_idx"
  ON "Media" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Media_reindex_idx"
  ON "Media" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Media_compartments_idx"
  ON "Media" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Media_basedOn_idx"
  ON "Media" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Media_created_idx"
  ON "Media" USING btree ("created");

CREATE INDEX IF NOT EXISTS "Media_device_idx"
  ON "Media" USING btree ("device");

CREATE INDEX IF NOT EXISTS "Media_encounter_idx"
  ON "Media" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Media___identifier_idx"
  ON "Media" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Media___modality_idx"
  ON "Media" USING gin ("__modality");

CREATE INDEX IF NOT EXISTS "Media_operator_idx"
  ON "Media" USING btree ("operator");

CREATE INDEX IF NOT EXISTS "Media_patient_idx"
  ON "Media" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Media___site_idx"
  ON "Media" USING gin ("__site");

CREATE INDEX IF NOT EXISTS "Media___status_idx"
  ON "Media" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Media_subject_idx"
  ON "Media" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Media___type_idx"
  ON "Media" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Media___view_idx"
  ON "Media" USING gin ("__view");

CREATE INDEX IF NOT EXISTS "Media___sharedTokens_idx"
  ON "Media" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Media___identifierText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___modalityText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__modalityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___siteText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__siteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___statusText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___typeText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___viewText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__viewText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media____tagText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media___sharedTokensText_trgm_idx"
  ON "Media" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Media_History_id_idx"
  ON "Media_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Media_History_lastUpdated_idx"
  ON "Media_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Media_References_targetId_code_idx"
  ON "Media_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Medication_lastUpdated_idx"
  ON "Medication" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Medication_projectId_lastUpdated_idx"
  ON "Medication" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Medication_projectId_idx"
  ON "Medication" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Medication__source_idx"
  ON "Medication" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Medication_profile_idx"
  ON "Medication" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Medication___version_idx"
  ON "Medication" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Medication_reindex_idx"
  ON "Medication" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Medication_compartments_idx"
  ON "Medication" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Medication___code_idx"
  ON "Medication" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Medication_expirationDate_idx"
  ON "Medication" USING btree ("expirationDate");

CREATE INDEX IF NOT EXISTS "Medication___form_idx"
  ON "Medication" USING gin ("__form");

CREATE INDEX IF NOT EXISTS "Medication___identifier_idx"
  ON "Medication" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Medication_ingredient_idx"
  ON "Medication" USING gin ("ingredient");

CREATE INDEX IF NOT EXISTS "Medication___ingredientCode_idx"
  ON "Medication" USING gin ("__ingredientCode");

CREATE INDEX IF NOT EXISTS "Medication___lotNumber_idx"
  ON "Medication" USING gin ("__lotNumber");

CREATE INDEX IF NOT EXISTS "Medication_manufacturer_idx"
  ON "Medication" USING btree ("manufacturer");

CREATE INDEX IF NOT EXISTS "Medication___status_idx"
  ON "Medication" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Medication___sharedTokens_idx"
  ON "Medication" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Medication___codeText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___formText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__formText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___identifierText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___ingredientCodeText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__ingredientCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___lotNumberText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__lotNumberText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___statusText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication____tagText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication___sharedTokensText_trgm_idx"
  ON "Medication" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Medication_History_id_idx"
  ON "Medication_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Medication_History_lastUpdated_idx"
  ON "Medication_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Medication_References_targetId_code_idx"
  ON "Medication_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_lastUpdated_idx"
  ON "MedicationAdministration" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_projectId_lastUpdated_idx"
  ON "MedicationAdministration" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_projectId_idx"
  ON "MedicationAdministration" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicationAdministration__source_idx"
  ON "MedicationAdministration" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_profile_idx"
  ON "MedicationAdministration" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___version_idx"
  ON "MedicationAdministration" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_reindex_idx"
  ON "MedicationAdministration" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicationAdministration_compartments_idx"
  ON "MedicationAdministration" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___code_idx"
  ON "MedicationAdministration" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_context_idx"
  ON "MedicationAdministration" USING btree ("context");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_device_idx"
  ON "MedicationAdministration" USING gin ("device");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_effectiveTime_idx"
  ON "MedicationAdministration" USING btree ("effectiveTime");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___identifier_idx"
  ON "MedicationAdministration" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_medication_idx"
  ON "MedicationAdministration" USING btree ("medication");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_patient_idx"
  ON "MedicationAdministration" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_performer_idx"
  ON "MedicationAdministration" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___reasonGiven_idx"
  ON "MedicationAdministration" USING gin ("__reasonGiven");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___reasonNotGiven_idx"
  ON "MedicationAdministration" USING gin ("__reasonNotGiven");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_request_idx"
  ON "MedicationAdministration" USING btree ("request");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___status_idx"
  ON "MedicationAdministration" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_subject_idx"
  ON "MedicationAdministration" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___sharedTokens_idx"
  ON "MedicationAdministration" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicationAdministration___codeText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration___identifierText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration___reasonGivenText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__reasonGivenText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration___reasonNotGivenText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__reasonNotGivenText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration___statusText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration____tagText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration___sharedTokensText_trgm_idx"
  ON "MedicationAdministration" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationAdministration_History_id_idx"
  ON "MedicationAdministration_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_History_lastUpdated_idx"
  ON "MedicationAdministration_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationAdministration_References_targetId_code_idx"
  ON "MedicationAdministration_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicationDispense_lastUpdated_idx"
  ON "MedicationDispense" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationDispense_projectId_lastUpdated_idx"
  ON "MedicationDispense" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationDispense_projectId_idx"
  ON "MedicationDispense" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicationDispense__source_idx"
  ON "MedicationDispense" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicationDispense_profile_idx"
  ON "MedicationDispense" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicationDispense___version_idx"
  ON "MedicationDispense" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicationDispense_reindex_idx"
  ON "MedicationDispense" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicationDispense_compartments_idx"
  ON "MedicationDispense" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicationDispense___code_idx"
  ON "MedicationDispense" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MedicationDispense_context_idx"
  ON "MedicationDispense" USING btree ("context");

CREATE INDEX IF NOT EXISTS "MedicationDispense_destination_idx"
  ON "MedicationDispense" USING btree ("destination");

CREATE INDEX IF NOT EXISTS "MedicationDispense___identifier_idx"
  ON "MedicationDispense" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicationDispense_medication_idx"
  ON "MedicationDispense" USING btree ("medication");

CREATE INDEX IF NOT EXISTS "MedicationDispense_patient_idx"
  ON "MedicationDispense" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MedicationDispense_performer_idx"
  ON "MedicationDispense" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "MedicationDispense_prescription_idx"
  ON "MedicationDispense" USING gin ("prescription");

CREATE INDEX IF NOT EXISTS "MedicationDispense_receiver_idx"
  ON "MedicationDispense" USING gin ("receiver");

CREATE INDEX IF NOT EXISTS "MedicationDispense_responsibleparty_idx"
  ON "MedicationDispense" USING gin ("responsibleparty");

CREATE INDEX IF NOT EXISTS "MedicationDispense___status_idx"
  ON "MedicationDispense" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicationDispense_subject_idx"
  ON "MedicationDispense" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MedicationDispense___type_idx"
  ON "MedicationDispense" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "MedicationDispense_whenhandedover_idx"
  ON "MedicationDispense" USING btree ("whenhandedover");

CREATE INDEX IF NOT EXISTS "MedicationDispense_whenprepared_idx"
  ON "MedicationDispense" USING btree ("whenprepared");

CREATE INDEX IF NOT EXISTS "MedicationDispense___sharedTokens_idx"
  ON "MedicationDispense" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicationDispense___codeText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense___identifierText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense___statusText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense___typeText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense____tagText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense___sharedTokensText_trgm_idx"
  ON "MedicationDispense" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationDispense_History_id_idx"
  ON "MedicationDispense_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicationDispense_History_lastUpdated_idx"
  ON "MedicationDispense_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationDispense_References_targetId_code_idx"
  ON "MedicationDispense_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_lastUpdated_idx"
  ON "MedicationKnowledge" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_projectId_lastUpdated_idx"
  ON "MedicationKnowledge" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_projectId_idx"
  ON "MedicationKnowledge" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge__source_idx"
  ON "MedicationKnowledge" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_profile_idx"
  ON "MedicationKnowledge" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___version_idx"
  ON "MedicationKnowledge" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_reindex_idx"
  ON "MedicationKnowledge" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_compartments_idx"
  ON "MedicationKnowledge" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___classification_idx"
  ON "MedicationKnowledge" USING gin ("__classification");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___classificationType_idx"
  ON "MedicationKnowledge" USING gin ("__classificationType");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___code_idx"
  ON "MedicationKnowledge" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___doseform_idx"
  ON "MedicationKnowledge" USING gin ("__doseform");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_ingredient_idx"
  ON "MedicationKnowledge" USING gin ("ingredient");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___ingredientCode_idx"
  ON "MedicationKnowledge" USING gin ("__ingredientCode");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_manufacturer_idx"
  ON "MedicationKnowledge" USING btree ("manufacturer");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monitoringProgramName_idx"
  ON "MedicationKnowledge" USING gin ("__monitoringProgramName");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monitoringProgramType_idx"
  ON "MedicationKnowledge" USING gin ("__monitoringProgramType");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_monograph_idx"
  ON "MedicationKnowledge" USING gin ("monograph");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monographType_idx"
  ON "MedicationKnowledge" USING gin ("__monographType");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___sourceCost_idx"
  ON "MedicationKnowledge" USING gin ("__sourceCost");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___status_idx"
  ON "MedicationKnowledge" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___sharedTokens_idx"
  ON "MedicationKnowledge" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___classificationText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__classificationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___classificationTypeText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__classificationTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___codeText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___doseformText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__doseformText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___ingredientCodeText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__ingredientCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monitoringProgramNameText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__monitoringProgramNameText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monitoringProgramTypeText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__monitoringProgramTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___monographTypeText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__monographTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___sourceCostText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__sourceCostText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___statusText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge____tagText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge___sharedTokensText_trgm_idx"
  ON "MedicationKnowledge" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_History_id_idx"
  ON "MedicationKnowledge_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_History_lastUpdated_idx"
  ON "MedicationKnowledge_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationKnowledge_References_targetId_code_idx"
  ON "MedicationKnowledge_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicationRequest_lastUpdated_idx"
  ON "MedicationRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationRequest_projectId_lastUpdated_idx"
  ON "MedicationRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationRequest_projectId_idx"
  ON "MedicationRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicationRequest__source_idx"
  ON "MedicationRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicationRequest_profile_idx"
  ON "MedicationRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicationRequest___version_idx"
  ON "MedicationRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicationRequest_reindex_idx"
  ON "MedicationRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicationRequest_compartments_idx"
  ON "MedicationRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicationRequest_authoredon_idx"
  ON "MedicationRequest" USING btree ("authoredon");

CREATE INDEX IF NOT EXISTS "MedicationRequest___category_idx"
  ON "MedicationRequest" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "MedicationRequest___code_idx"
  ON "MedicationRequest" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MedicationRequest_date_idx"
  ON "MedicationRequest" USING gin ("date");

CREATE INDEX IF NOT EXISTS "MedicationRequest_encounter_idx"
  ON "MedicationRequest" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "MedicationRequest___identifier_idx"
  ON "MedicationRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicationRequest_intendedDispenser_idx"
  ON "MedicationRequest" USING btree ("intendedDispenser");

CREATE INDEX IF NOT EXISTS "MedicationRequest_intendedPerformer_idx"
  ON "MedicationRequest" USING btree ("intendedPerformer");

CREATE INDEX IF NOT EXISTS "MedicationRequest___intendedPerformertype_idx"
  ON "MedicationRequest" USING gin ("__intendedPerformertype");

CREATE INDEX IF NOT EXISTS "MedicationRequest___intent_idx"
  ON "MedicationRequest" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "MedicationRequest_medication_idx"
  ON "MedicationRequest" USING btree ("medication");

CREATE INDEX IF NOT EXISTS "MedicationRequest_patient_idx"
  ON "MedicationRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MedicationRequest___priority_idx"
  ON "MedicationRequest" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "MedicationRequest_requester_idx"
  ON "MedicationRequest" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "MedicationRequest___status_idx"
  ON "MedicationRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicationRequest_subject_idx"
  ON "MedicationRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MedicationRequest___sharedTokens_idx"
  ON "MedicationRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicationRequest___categoryText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___codeText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___identifierText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___intendedPerformertypeText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__intendedPerformertypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___intentText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___priorityText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___statusText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest____tagText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest___sharedTokensText_trgm_idx"
  ON "MedicationRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationRequest_History_id_idx"
  ON "MedicationRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicationRequest_History_lastUpdated_idx"
  ON "MedicationRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationRequest_References_targetId_code_idx"
  ON "MedicationRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicationStatement_lastUpdated_idx"
  ON "MedicationStatement" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationStatement_projectId_lastUpdated_idx"
  ON "MedicationStatement" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationStatement_projectId_idx"
  ON "MedicationStatement" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicationStatement__source_idx"
  ON "MedicationStatement" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicationStatement_profile_idx"
  ON "MedicationStatement" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicationStatement___version_idx"
  ON "MedicationStatement" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicationStatement_reindex_idx"
  ON "MedicationStatement" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicationStatement_compartments_idx"
  ON "MedicationStatement" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicationStatement___category_idx"
  ON "MedicationStatement" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "MedicationStatement___code_idx"
  ON "MedicationStatement" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MedicationStatement_context_idx"
  ON "MedicationStatement" USING btree ("context");

CREATE INDEX IF NOT EXISTS "MedicationStatement_effective_idx"
  ON "MedicationStatement" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "MedicationStatement___identifier_idx"
  ON "MedicationStatement" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicationStatement_medication_idx"
  ON "MedicationStatement" USING btree ("medication");

CREATE INDEX IF NOT EXISTS "MedicationStatement_partOf_idx"
  ON "MedicationStatement" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "MedicationStatement_patient_idx"
  ON "MedicationStatement" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MedicationStatement_source_idx"
  ON "MedicationStatement" USING btree ("source");

CREATE INDEX IF NOT EXISTS "MedicationStatement___status_idx"
  ON "MedicationStatement" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicationStatement_subject_idx"
  ON "MedicationStatement" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MedicationStatement___sharedTokens_idx"
  ON "MedicationStatement" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicationStatement___categoryText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement___codeText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement___identifierText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement___statusText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement____tagText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement___sharedTokensText_trgm_idx"
  ON "MedicationStatement" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicationStatement_History_id_idx"
  ON "MedicationStatement_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicationStatement_History_lastUpdated_idx"
  ON "MedicationStatement_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicationStatement_References_targetId_code_idx"
  ON "MedicationStatement_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_lastUpdated_idx"
  ON "MedicinalProduct" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_projectId_lastUpdated_idx"
  ON "MedicinalProduct" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_projectId_idx"
  ON "MedicinalProduct" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProduct__source_idx"
  ON "MedicinalProduct" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_profile_idx"
  ON "MedicinalProduct" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___version_idx"
  ON "MedicinalProduct" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_reindex_idx"
  ON "MedicinalProduct" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProduct_compartments_idx"
  ON "MedicinalProduct" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___identifier_idx"
  ON "MedicinalProduct" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___nameSort_idx"
  ON "MedicinalProduct" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___nameLanguage_idx"
  ON "MedicinalProduct" USING gin ("__nameLanguage");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___sharedTokens_idx"
  ON "MedicinalProduct" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProduct___identifierText_trgm_idx"
  ON "MedicinalProduct" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProduct___nameLanguageText_trgm_idx"
  ON "MedicinalProduct" USING gin (token_array_to_text("__nameLanguageText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProduct____tagText_trgm_idx"
  ON "MedicinalProduct" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProduct___sharedTokensText_trgm_idx"
  ON "MedicinalProduct" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProduct_History_id_idx"
  ON "MedicinalProduct_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_History_lastUpdated_idx"
  ON "MedicinalProduct_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProduct_References_targetId_code_idx"
  ON "MedicinalProduct_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_lastUpdated_idx"
  ON "MedicinalProductAuthorization" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_projectId_lastUpdated_idx"
  ON "MedicinalProductAuthorization" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_projectId_idx"
  ON "MedicinalProductAuthorization" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization__source_idx"
  ON "MedicinalProductAuthorization" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_profile_idx"
  ON "MedicinalProductAuthorization" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___version_idx"
  ON "MedicinalProductAuthorization" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_reindex_idx"
  ON "MedicinalProductAuthorization" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_compartments_idx"
  ON "MedicinalProductAuthorization" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___country_idx"
  ON "MedicinalProductAuthorization" USING gin ("__country");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_holder_idx"
  ON "MedicinalProductAuthorization" USING btree ("holder");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___identifier_idx"
  ON "MedicinalProductAuthorization" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___status_idx"
  ON "MedicinalProductAuthorization" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_subject_idx"
  ON "MedicinalProductAuthorization" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___sharedTokens_idx"
  ON "MedicinalProductAuthorization" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___countryText_trgm_idx"
  ON "MedicinalProductAuthorization" USING gin (token_array_to_text("__countryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___identifierText_trgm_idx"
  ON "MedicinalProductAuthorization" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___statusText_trgm_idx"
  ON "MedicinalProductAuthorization" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization____tagText_trgm_idx"
  ON "MedicinalProductAuthorization" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization___sharedTokensText_trgm_idx"
  ON "MedicinalProductAuthorization" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_History_id_idx"
  ON "MedicinalProductAuthorization_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_History_lastUpdated_idx"
  ON "MedicinalProductAuthorization_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductAuthorization_References_targetId_code_idx"
  ON "MedicinalProductAuthorization_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_lastUpdated_idx"
  ON "MedicinalProductContraindication" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_projectId_lastUpdated_idx"
  ON "MedicinalProductContraindication" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_projectId_idx"
  ON "MedicinalProductContraindication" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication__source_idx"
  ON "MedicinalProductContraindication" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_profile_idx"
  ON "MedicinalProductContraindication" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication___version_idx"
  ON "MedicinalProductContraindication" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_reindex_idx"
  ON "MedicinalProductContraindication" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_compartments_idx"
  ON "MedicinalProductContraindication" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_subject_idx"
  ON "MedicinalProductContraindication" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication___sharedTokens_idx"
  ON "MedicinalProductContraindication" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication____tagText_trgm_idx"
  ON "MedicinalProductContraindication" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication___sharedTokensText_trgm_idx"
  ON "MedicinalProductContraindication" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_History_id_idx"
  ON "MedicinalProductContraindication_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_History_lastUpdated_idx"
  ON "MedicinalProductContraindication_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductContraindication_References_targetId_code_idx"
  ON "MedicinalProductContraindication_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_lastUpdated_idx"
  ON "MedicinalProductIndication" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_projectId_lastUpdated_idx"
  ON "MedicinalProductIndication" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_projectId_idx"
  ON "MedicinalProductIndication" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication__source_idx"
  ON "MedicinalProductIndication" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_profile_idx"
  ON "MedicinalProductIndication" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication___version_idx"
  ON "MedicinalProductIndication" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_reindex_idx"
  ON "MedicinalProductIndication" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_compartments_idx"
  ON "MedicinalProductIndication" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_subject_idx"
  ON "MedicinalProductIndication" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication___sharedTokens_idx"
  ON "MedicinalProductIndication" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication____tagText_trgm_idx"
  ON "MedicinalProductIndication" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication___sharedTokensText_trgm_idx"
  ON "MedicinalProductIndication" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_History_id_idx"
  ON "MedicinalProductIndication_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_History_lastUpdated_idx"
  ON "MedicinalProductIndication_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIndication_References_targetId_code_idx"
  ON "MedicinalProductIndication_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_lastUpdated_idx"
  ON "MedicinalProductIngredient" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_projectId_lastUpdated_idx"
  ON "MedicinalProductIngredient" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_projectId_idx"
  ON "MedicinalProductIngredient" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient__source_idx"
  ON "MedicinalProductIngredient" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_profile_idx"
  ON "MedicinalProductIngredient" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient___version_idx"
  ON "MedicinalProductIngredient" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_reindex_idx"
  ON "MedicinalProductIngredient" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_compartments_idx"
  ON "MedicinalProductIngredient" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient___sharedTokens_idx"
  ON "MedicinalProductIngredient" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient____tagText_trgm_idx"
  ON "MedicinalProductIngredient" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient___sharedTokensText_trgm_idx"
  ON "MedicinalProductIngredient" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_History_id_idx"
  ON "MedicinalProductIngredient_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_History_lastUpdated_idx"
  ON "MedicinalProductIngredient_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductIngredient_References_targetId_code_idx"
  ON "MedicinalProductIngredient_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_lastUpdated_idx"
  ON "MedicinalProductInteraction" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_projectId_lastUpdated_idx"
  ON "MedicinalProductInteraction" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_projectId_idx"
  ON "MedicinalProductInteraction" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction__source_idx"
  ON "MedicinalProductInteraction" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_profile_idx"
  ON "MedicinalProductInteraction" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction___version_idx"
  ON "MedicinalProductInteraction" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_reindex_idx"
  ON "MedicinalProductInteraction" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_compartments_idx"
  ON "MedicinalProductInteraction" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_subject_idx"
  ON "MedicinalProductInteraction" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction___sharedTokens_idx"
  ON "MedicinalProductInteraction" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction____tagText_trgm_idx"
  ON "MedicinalProductInteraction" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction___sharedTokensText_trgm_idx"
  ON "MedicinalProductInteraction" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_History_id_idx"
  ON "MedicinalProductInteraction_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_History_lastUpdated_idx"
  ON "MedicinalProductInteraction_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductInteraction_References_targetId_code_idx"
  ON "MedicinalProductInteraction_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_lastUpdated_idx"
  ON "MedicinalProductManufactured" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_projectId_lastUpdated_idx"
  ON "MedicinalProductManufactured" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_projectId_idx"
  ON "MedicinalProductManufactured" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured__source_idx"
  ON "MedicinalProductManufactured" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_profile_idx"
  ON "MedicinalProductManufactured" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured___version_idx"
  ON "MedicinalProductManufactured" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_reindex_idx"
  ON "MedicinalProductManufactured" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_compartments_idx"
  ON "MedicinalProductManufactured" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured___sharedTokens_idx"
  ON "MedicinalProductManufactured" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured____tagText_trgm_idx"
  ON "MedicinalProductManufactured" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured___sharedTokensText_trgm_idx"
  ON "MedicinalProductManufactured" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_History_id_idx"
  ON "MedicinalProductManufactured_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_History_lastUpdated_idx"
  ON "MedicinalProductManufactured_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductManufactured_References_targetId_code_idx"
  ON "MedicinalProductManufactured_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_lastUpdated_idx"
  ON "MedicinalProductPackaged" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_projectId_lastUpdated_idx"
  ON "MedicinalProductPackaged" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_projectId_idx"
  ON "MedicinalProductPackaged" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged__source_idx"
  ON "MedicinalProductPackaged" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_profile_idx"
  ON "MedicinalProductPackaged" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged___version_idx"
  ON "MedicinalProductPackaged" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_reindex_idx"
  ON "MedicinalProductPackaged" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_compartments_idx"
  ON "MedicinalProductPackaged" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged___identifier_idx"
  ON "MedicinalProductPackaged" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_subject_idx"
  ON "MedicinalProductPackaged" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged___sharedTokens_idx"
  ON "MedicinalProductPackaged" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged___identifierText_trgm_idx"
  ON "MedicinalProductPackaged" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged____tagText_trgm_idx"
  ON "MedicinalProductPackaged" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged___sharedTokensText_trgm_idx"
  ON "MedicinalProductPackaged" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_History_id_idx"
  ON "MedicinalProductPackaged_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_History_lastUpdated_idx"
  ON "MedicinalProductPackaged_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPackaged_References_targetId_code_idx"
  ON "MedicinalProductPackaged_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_lastUpdated_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_projectId_lastUpdated_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_projectId_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical__source_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_profile_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___version_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_reindex_idx"
  ON "MedicinalProductPharmaceutical" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_compartments_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___identifier_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___route_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("__route");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___targetSpecies_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("__targetSpecies");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___sharedTokens_idx"
  ON "MedicinalProductPharmaceutical" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___identifierText_trgm_idx"
  ON "MedicinalProductPharmaceutical" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___routeText_trgm_idx"
  ON "MedicinalProductPharmaceutical" USING gin (token_array_to_text("__routeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___targetSpeciesText_trgm_idx"
  ON "MedicinalProductPharmaceutical" USING gin (token_array_to_text("__targetSpeciesText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical____tagText_trgm_idx"
  ON "MedicinalProductPharmaceutical" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical___sharedTokensText_trgm_idx"
  ON "MedicinalProductPharmaceutical" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_History_id_idx"
  ON "MedicinalProductPharmaceutical_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_History_lastUpdated_idx"
  ON "MedicinalProductPharmaceutical_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductPharmaceutical_References_targetId_code_idx"
  ON "MedicinalProductPharmaceutical_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_lastUpdated_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_projectId_lastUpdated_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_projectId_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect__source_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_profile_idx"
  ON "MedicinalProductUndesirableEffect" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect___version_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_reindex_idx"
  ON "MedicinalProductUndesirableEffect" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_compartments_idx"
  ON "MedicinalProductUndesirableEffect" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_subject_idx"
  ON "MedicinalProductUndesirableEffect" USING gin ("subject");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect___sharedTokens_idx"
  ON "MedicinalProductUndesirableEffect" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect____tagText_trgm_idx"
  ON "MedicinalProductUndesirableEffect" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect___sharedTokensText_trgm_idx"
  ON "MedicinalProductUndesirableEffect" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_History_id_idx"
  ON "MedicinalProductUndesirableEffect_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_History_lastUpdated_idx"
  ON "MedicinalProductUndesirableEffect_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MedicinalProductUndesirableEffect_References_targetId_code_idx"
  ON "MedicinalProductUndesirableEffect_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MessageDefinition_lastUpdated_idx"
  ON "MessageDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageDefinition_projectId_lastUpdated_idx"
  ON "MessageDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageDefinition_projectId_idx"
  ON "MessageDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MessageDefinition__source_idx"
  ON "MessageDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MessageDefinition_profile_idx"
  ON "MessageDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MessageDefinition___version_idx"
  ON "MessageDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MessageDefinition_reindex_idx"
  ON "MessageDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MessageDefinition_compartments_idx"
  ON "MessageDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MessageDefinition___category_idx"
  ON "MessageDefinition" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "MessageDefinition___context_idx"
  ON "MessageDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "MessageDefinition_contextQuantity_idx"
  ON "MessageDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "MessageDefinition___contextType_idx"
  ON "MessageDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "MessageDefinition_date_idx"
  ON "MessageDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "MessageDefinition_description_idx"
  ON "MessageDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "MessageDefinition___event_idx"
  ON "MessageDefinition" USING gin ("__event");

CREATE INDEX IF NOT EXISTS "MessageDefinition___focus_idx"
  ON "MessageDefinition" USING gin ("__focus");

CREATE INDEX IF NOT EXISTS "MessageDefinition___identifier_idx"
  ON "MessageDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MessageDefinition___jurisdiction_idx"
  ON "MessageDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "MessageDefinition___nameSort_idx"
  ON "MessageDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "MessageDefinition_parent_idx"
  ON "MessageDefinition" USING gin ("parent");

CREATE INDEX IF NOT EXISTS "MessageDefinition_publisher_idx"
  ON "MessageDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "MessageDefinition___status_idx"
  ON "MessageDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "MessageDefinition_title_idx"
  ON "MessageDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "MessageDefinition_url_idx"
  ON "MessageDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "MessageDefinition_version_idx"
  ON "MessageDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "MessageDefinition___sharedTokens_idx"
  ON "MessageDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MessageDefinition___categoryText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___contextText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___contextTypeText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___eventText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__eventText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___focusText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__focusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___identifierText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___jurisdictionText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___statusText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition____tagText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition___sharedTokensText_trgm_idx"
  ON "MessageDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageDefinition_History_id_idx"
  ON "MessageDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MessageDefinition_History_lastUpdated_idx"
  ON "MessageDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageDefinition_References_targetId_code_idx"
  ON "MessageDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MessageHeader_lastUpdated_idx"
  ON "MessageHeader" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageHeader_projectId_lastUpdated_idx"
  ON "MessageHeader" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageHeader_projectId_idx"
  ON "MessageHeader" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MessageHeader__source_idx"
  ON "MessageHeader" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MessageHeader_profile_idx"
  ON "MessageHeader" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MessageHeader___version_idx"
  ON "MessageHeader" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MessageHeader_reindex_idx"
  ON "MessageHeader" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MessageHeader_compartments_idx"
  ON "MessageHeader" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MessageHeader_author_idx"
  ON "MessageHeader" USING btree ("author");

CREATE INDEX IF NOT EXISTS "MessageHeader___code_idx"
  ON "MessageHeader" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "MessageHeader_destination_idx"
  ON "MessageHeader" USING gin ("destination");

CREATE INDEX IF NOT EXISTS "MessageHeader_destinationUri_idx"
  ON "MessageHeader" USING gin ("destinationUri");

CREATE INDEX IF NOT EXISTS "MessageHeader_enterer_idx"
  ON "MessageHeader" USING btree ("enterer");

CREATE INDEX IF NOT EXISTS "MessageHeader___event_idx"
  ON "MessageHeader" USING gin ("__event");

CREATE INDEX IF NOT EXISTS "MessageHeader_focus_idx"
  ON "MessageHeader" USING gin ("focus");

CREATE INDEX IF NOT EXISTS "MessageHeader_receiver_idx"
  ON "MessageHeader" USING gin ("receiver");

CREATE INDEX IF NOT EXISTS "MessageHeader___responseId_idx"
  ON "MessageHeader" USING gin ("__responseId");

CREATE INDEX IF NOT EXISTS "MessageHeader_responsible_idx"
  ON "MessageHeader" USING btree ("responsible");

CREATE INDEX IF NOT EXISTS "MessageHeader_sender_idx"
  ON "MessageHeader" USING btree ("sender");

CREATE INDEX IF NOT EXISTS "MessageHeader_source_idx"
  ON "MessageHeader" USING btree ("source");

CREATE INDEX IF NOT EXISTS "MessageHeader_sourceUri_idx"
  ON "MessageHeader" USING btree ("sourceUri");

CREATE INDEX IF NOT EXISTS "MessageHeader_target_idx"
  ON "MessageHeader" USING gin ("target");

CREATE INDEX IF NOT EXISTS "MessageHeader___sharedTokens_idx"
  ON "MessageHeader" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MessageHeader___codeText_trgm_idx"
  ON "MessageHeader" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageHeader___eventText_trgm_idx"
  ON "MessageHeader" USING gin (token_array_to_text("__eventText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageHeader___responseIdText_trgm_idx"
  ON "MessageHeader" USING gin (token_array_to_text("__responseIdText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageHeader____tagText_trgm_idx"
  ON "MessageHeader" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageHeader___sharedTokensText_trgm_idx"
  ON "MessageHeader" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MessageHeader_History_id_idx"
  ON "MessageHeader_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MessageHeader_History_lastUpdated_idx"
  ON "MessageHeader_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MessageHeader_References_targetId_code_idx"
  ON "MessageHeader_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "MolecularSequence_lastUpdated_idx"
  ON "MolecularSequence" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MolecularSequence_projectId_lastUpdated_idx"
  ON "MolecularSequence" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "MolecularSequence_projectId_idx"
  ON "MolecularSequence" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "MolecularSequence__source_idx"
  ON "MolecularSequence" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "MolecularSequence_profile_idx"
  ON "MolecularSequence" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "MolecularSequence___version_idx"
  ON "MolecularSequence" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "MolecularSequence_reindex_idx"
  ON "MolecularSequence" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "MolecularSequence_compartments_idx"
  ON "MolecularSequence" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "MolecularSequence___chromosome_idx"
  ON "MolecularSequence" USING gin ("__chromosome");

CREATE INDEX IF NOT EXISTS "MolecularSequence___identifier_idx"
  ON "MolecularSequence" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "MolecularSequence_patient_idx"
  ON "MolecularSequence" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "MolecularSequence___referenceseqid_idx"
  ON "MolecularSequence" USING gin ("__referenceseqid");

CREATE INDEX IF NOT EXISTS "MolecularSequence___type_idx"
  ON "MolecularSequence" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "MolecularSequence_variantEnd_idx"
  ON "MolecularSequence" USING gin ("variantEnd");

CREATE INDEX IF NOT EXISTS "MolecularSequence_variantStart_idx"
  ON "MolecularSequence" USING gin ("variantStart");

CREATE INDEX IF NOT EXISTS "MolecularSequence_windowEnd_idx"
  ON "MolecularSequence" USING btree ("windowEnd");

CREATE INDEX IF NOT EXISTS "MolecularSequence_windowStart_idx"
  ON "MolecularSequence" USING btree ("windowStart");

CREATE INDEX IF NOT EXISTS "MolecularSequence___sharedTokens_idx"
  ON "MolecularSequence" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "MolecularSequence___chromosomeText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("__chromosomeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence___identifierText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence___referenceseqidText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("__referenceseqidText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence___typeText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence____tagText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence___sharedTokensText_trgm_idx"
  ON "MolecularSequence" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "MolecularSequence_History_id_idx"
  ON "MolecularSequence_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "MolecularSequence_History_lastUpdated_idx"
  ON "MolecularSequence_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "MolecularSequence_References_targetId_code_idx"
  ON "MolecularSequence_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "NamingSystem_lastUpdated_idx"
  ON "NamingSystem" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "NamingSystem_projectId_lastUpdated_idx"
  ON "NamingSystem" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "NamingSystem_projectId_idx"
  ON "NamingSystem" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "NamingSystem__source_idx"
  ON "NamingSystem" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "NamingSystem_profile_idx"
  ON "NamingSystem" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "NamingSystem___version_idx"
  ON "NamingSystem" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "NamingSystem_reindex_idx"
  ON "NamingSystem" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "NamingSystem_compartments_idx"
  ON "NamingSystem" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "NamingSystem_contact_idx"
  ON "NamingSystem" USING gin ("contact");

CREATE INDEX IF NOT EXISTS "NamingSystem___context_idx"
  ON "NamingSystem" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "NamingSystem_contextQuantity_idx"
  ON "NamingSystem" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "NamingSystem___contextType_idx"
  ON "NamingSystem" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "NamingSystem_date_idx"
  ON "NamingSystem" USING btree ("date");

CREATE INDEX IF NOT EXISTS "NamingSystem_description_idx"
  ON "NamingSystem" USING btree ("description");

CREATE INDEX IF NOT EXISTS "NamingSystem___idType_idx"
  ON "NamingSystem" USING gin ("__idType");

CREATE INDEX IF NOT EXISTS "NamingSystem___jurisdiction_idx"
  ON "NamingSystem" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "NamingSystem___kind_idx"
  ON "NamingSystem" USING gin ("__kind");

CREATE INDEX IF NOT EXISTS "NamingSystem___nameSort_idx"
  ON "NamingSystem" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "NamingSystem_period_idx"
  ON "NamingSystem" USING gin ("period");

CREATE INDEX IF NOT EXISTS "NamingSystem_publisher_idx"
  ON "NamingSystem" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "NamingSystem_responsible_idx"
  ON "NamingSystem" USING btree ("responsible");

CREATE INDEX IF NOT EXISTS "NamingSystem___status_idx"
  ON "NamingSystem" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "NamingSystem___telecomSort_idx"
  ON "NamingSystem" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "NamingSystem___type_idx"
  ON "NamingSystem" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "NamingSystem_value_idx"
  ON "NamingSystem" USING gin ("value");

CREATE INDEX IF NOT EXISTS "NamingSystem___sharedTokens_idx"
  ON "NamingSystem" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "NamingSystem___contextText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___contextTypeText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___idTypeText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__idTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___jurisdictionText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___kindText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__kindText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___statusText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___typeText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem____tagText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem___sharedTokensText_trgm_idx"
  ON "NamingSystem" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NamingSystem_History_id_idx"
  ON "NamingSystem_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "NamingSystem_History_lastUpdated_idx"
  ON "NamingSystem_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "NamingSystem_References_targetId_code_idx"
  ON "NamingSystem_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "NutritionOrder_lastUpdated_idx"
  ON "NutritionOrder" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "NutritionOrder_projectId_lastUpdated_idx"
  ON "NutritionOrder" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "NutritionOrder_projectId_idx"
  ON "NutritionOrder" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "NutritionOrder__source_idx"
  ON "NutritionOrder" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "NutritionOrder_profile_idx"
  ON "NutritionOrder" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "NutritionOrder___version_idx"
  ON "NutritionOrder" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "NutritionOrder_reindex_idx"
  ON "NutritionOrder" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "NutritionOrder_compartments_idx"
  ON "NutritionOrder" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "NutritionOrder___additive_idx"
  ON "NutritionOrder" USING gin ("__additive");

CREATE INDEX IF NOT EXISTS "NutritionOrder_datetime_idx"
  ON "NutritionOrder" USING btree ("datetime");

CREATE INDEX IF NOT EXISTS "NutritionOrder_encounter_idx"
  ON "NutritionOrder" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "NutritionOrder___formula_idx"
  ON "NutritionOrder" USING gin ("__formula");

CREATE INDEX IF NOT EXISTS "NutritionOrder___identifier_idx"
  ON "NutritionOrder" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "NutritionOrder_instantiatesCanonical_idx"
  ON "NutritionOrder" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "NutritionOrder_instantiatesUri_idx"
  ON "NutritionOrder" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "NutritionOrder___oraldiet_idx"
  ON "NutritionOrder" USING gin ("__oraldiet");

CREATE INDEX IF NOT EXISTS "NutritionOrder_patient_idx"
  ON "NutritionOrder" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "NutritionOrder_provider_idx"
  ON "NutritionOrder" USING btree ("provider");

CREATE INDEX IF NOT EXISTS "NutritionOrder___status_idx"
  ON "NutritionOrder" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "NutritionOrder___supplement_idx"
  ON "NutritionOrder" USING gin ("__supplement");

CREATE INDEX IF NOT EXISTS "NutritionOrder___sharedTokens_idx"
  ON "NutritionOrder" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "NutritionOrder___additiveText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__additiveText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___formulaText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__formulaText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___identifierText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___oraldietText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__oraldietText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___statusText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___supplementText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__supplementText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder____tagText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder___sharedTokensText_trgm_idx"
  ON "NutritionOrder" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "NutritionOrder_History_id_idx"
  ON "NutritionOrder_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "NutritionOrder_History_lastUpdated_idx"
  ON "NutritionOrder_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "NutritionOrder_References_targetId_code_idx"
  ON "NutritionOrder_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Observation_lastUpdated_idx"
  ON "Observation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Observation_projectId_lastUpdated_idx"
  ON "Observation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Observation_projectId_idx"
  ON "Observation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Observation__source_idx"
  ON "Observation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Observation_profile_idx"
  ON "Observation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Observation___version_idx"
  ON "Observation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Observation_reindex_idx"
  ON "Observation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Observation_compartments_idx"
  ON "Observation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Observation_basedOn_idx"
  ON "Observation" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Observation___category_idx"
  ON "Observation" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Observation___code_idx"
  ON "Observation" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Observation___comboCode_idx"
  ON "Observation" USING gin ("__comboCode");

CREATE INDEX IF NOT EXISTS "Observation___comboDataAbsentReason_idx"
  ON "Observation" USING gin ("__comboDataAbsentReason");

CREATE INDEX IF NOT EXISTS "Observation___comboValueConcept_idx"
  ON "Observation" USING gin ("__comboValueConcept");

CREATE INDEX IF NOT EXISTS "Observation_comboValueQuantity_idx"
  ON "Observation" USING gin ("comboValueQuantity");

CREATE INDEX IF NOT EXISTS "Observation___componentCode_idx"
  ON "Observation" USING gin ("__componentCode");

CREATE INDEX IF NOT EXISTS "Observation___componentDataAbsentReason_idx"
  ON "Observation" USING gin ("__componentDataAbsentReason");

CREATE INDEX IF NOT EXISTS "Observation___componentValueConcept_idx"
  ON "Observation" USING gin ("__componentValueConcept");

CREATE INDEX IF NOT EXISTS "Observation_componentValueQuantity_idx"
  ON "Observation" USING gin ("componentValueQuantity");

CREATE INDEX IF NOT EXISTS "Observation___dataAbsentReason_idx"
  ON "Observation" USING gin ("__dataAbsentReason");

CREATE INDEX IF NOT EXISTS "Observation_date_idx"
  ON "Observation" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Observation_derivedFrom_idx"
  ON "Observation" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "Observation_device_idx"
  ON "Observation" USING btree ("device");

CREATE INDEX IF NOT EXISTS "Observation_encounter_idx"
  ON "Observation" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Observation_focus_idx"
  ON "Observation" USING gin ("focus");

CREATE INDEX IF NOT EXISTS "Observation_hasMember_idx"
  ON "Observation" USING gin ("hasMember");

CREATE INDEX IF NOT EXISTS "Observation___identifier_idx"
  ON "Observation" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Observation___method_idx"
  ON "Observation" USING gin ("__method");

CREATE INDEX IF NOT EXISTS "Observation_partOf_idx"
  ON "Observation" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "Observation_patient_idx"
  ON "Observation" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Observation_performer_idx"
  ON "Observation" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "Observation_specimen_idx"
  ON "Observation" USING btree ("specimen");

CREATE INDEX IF NOT EXISTS "Observation___status_idx"
  ON "Observation" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Observation_subject_idx"
  ON "Observation" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Observation___valueConcept_idx"
  ON "Observation" USING gin ("__valueConcept");

CREATE INDEX IF NOT EXISTS "Observation_valueDate_idx"
  ON "Observation" USING btree ("valueDate");

CREATE INDEX IF NOT EXISTS "Observation_valueQuantity_idx"
  ON "Observation" USING btree ("valueQuantity");

CREATE INDEX IF NOT EXISTS "Observation_valueString_idx"
  ON "Observation" USING btree ("valueString");

CREATE INDEX IF NOT EXISTS "Observation___sharedTokens_idx"
  ON "Observation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Observation___categoryText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___codeText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___comboCodeText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__comboCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___comboDataAbsentReasonText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__comboDataAbsentReasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___comboValueConceptText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__comboValueConceptText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___componentCodeText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__componentCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___componentDataAbsentReasonText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__componentDataAbsentReasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___componentValueConceptText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__componentValueConceptText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___dataAbsentReasonText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__dataAbsentReasonText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___identifierText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___methodText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__methodText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___statusText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___valueConceptText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__valueConceptText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation____tagText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation___sharedTokensText_trgm_idx"
  ON "Observation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Observation_History_id_idx"
  ON "Observation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Observation_History_lastUpdated_idx"
  ON "Observation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Observation_References_targetId_code_idx"
  ON "Observation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_lastUpdated_idx"
  ON "ObservationDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_projectId_lastUpdated_idx"
  ON "ObservationDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_projectId_idx"
  ON "ObservationDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ObservationDefinition__source_idx"
  ON "ObservationDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_profile_idx"
  ON "ObservationDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ObservationDefinition___version_idx"
  ON "ObservationDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_reindex_idx"
  ON "ObservationDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ObservationDefinition_compartments_idx"
  ON "ObservationDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ObservationDefinition___sharedTokens_idx"
  ON "ObservationDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ObservationDefinition____tagText_trgm_idx"
  ON "ObservationDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ObservationDefinition___sharedTokensText_trgm_idx"
  ON "ObservationDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ObservationDefinition_History_id_idx"
  ON "ObservationDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_History_lastUpdated_idx"
  ON "ObservationDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ObservationDefinition_References_targetId_code_idx"
  ON "ObservationDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "OperationDefinition_lastUpdated_idx"
  ON "OperationDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationDefinition_projectId_lastUpdated_idx"
  ON "OperationDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationDefinition_projectId_idx"
  ON "OperationDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "OperationDefinition__source_idx"
  ON "OperationDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "OperationDefinition_profile_idx"
  ON "OperationDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "OperationDefinition___version_idx"
  ON "OperationDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "OperationDefinition_reindex_idx"
  ON "OperationDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "OperationDefinition_compartments_idx"
  ON "OperationDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "OperationDefinition_base_idx"
  ON "OperationDefinition" USING btree ("base");

CREATE INDEX IF NOT EXISTS "OperationDefinition___code_idx"
  ON "OperationDefinition" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "OperationDefinition___context_idx"
  ON "OperationDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "OperationDefinition_contextQuantity_idx"
  ON "OperationDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "OperationDefinition___contextType_idx"
  ON "OperationDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "OperationDefinition_date_idx"
  ON "OperationDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "OperationDefinition_description_idx"
  ON "OperationDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "OperationDefinition_inputProfile_idx"
  ON "OperationDefinition" USING btree ("inputProfile");

CREATE INDEX IF NOT EXISTS "OperationDefinition___instance_idx"
  ON "OperationDefinition" USING gin ("__instance");

CREATE INDEX IF NOT EXISTS "OperationDefinition___jurisdiction_idx"
  ON "OperationDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "OperationDefinition___kind_idx"
  ON "OperationDefinition" USING gin ("__kind");

CREATE INDEX IF NOT EXISTS "OperationDefinition___nameSort_idx"
  ON "OperationDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "OperationDefinition_outputProfile_idx"
  ON "OperationDefinition" USING btree ("outputProfile");

CREATE INDEX IF NOT EXISTS "OperationDefinition_publisher_idx"
  ON "OperationDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "OperationDefinition___status_idx"
  ON "OperationDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "OperationDefinition___system_idx"
  ON "OperationDefinition" USING gin ("__system");

CREATE INDEX IF NOT EXISTS "OperationDefinition_title_idx"
  ON "OperationDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "OperationDefinition___type_idx"
  ON "OperationDefinition" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "OperationDefinition_url_idx"
  ON "OperationDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "OperationDefinition_version_idx"
  ON "OperationDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "OperationDefinition___sharedTokens_idx"
  ON "OperationDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "OperationDefinition___codeText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___contextText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___contextTypeText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___instanceText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__instanceText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___jurisdictionText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___kindText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__kindText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___statusText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___systemText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__systemText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___typeText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition____tagText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition___sharedTokensText_trgm_idx"
  ON "OperationDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationDefinition_History_id_idx"
  ON "OperationDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "OperationDefinition_History_lastUpdated_idx"
  ON "OperationDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationDefinition_References_targetId_code_idx"
  ON "OperationDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "OperationOutcome_lastUpdated_idx"
  ON "OperationOutcome" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationOutcome_projectId_lastUpdated_idx"
  ON "OperationOutcome" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationOutcome_projectId_idx"
  ON "OperationOutcome" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "OperationOutcome__source_idx"
  ON "OperationOutcome" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "OperationOutcome_profile_idx"
  ON "OperationOutcome" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "OperationOutcome___version_idx"
  ON "OperationOutcome" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "OperationOutcome_reindex_idx"
  ON "OperationOutcome" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "OperationOutcome_compartments_idx"
  ON "OperationOutcome" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "OperationOutcome___sharedTokens_idx"
  ON "OperationOutcome" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "OperationOutcome____tagText_trgm_idx"
  ON "OperationOutcome" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationOutcome___sharedTokensText_trgm_idx"
  ON "OperationOutcome" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OperationOutcome_History_id_idx"
  ON "OperationOutcome_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "OperationOutcome_History_lastUpdated_idx"
  ON "OperationOutcome_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OperationOutcome_References_targetId_code_idx"
  ON "OperationOutcome_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Organization_lastUpdated_idx"
  ON "Organization" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Organization_projectId_lastUpdated_idx"
  ON "Organization" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Organization_projectId_idx"
  ON "Organization" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Organization__source_idx"
  ON "Organization" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Organization_profile_idx"
  ON "Organization" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Organization___version_idx"
  ON "Organization" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Organization_reindex_idx"
  ON "Organization" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Organization_compartments_idx"
  ON "Organization" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Organization___active_idx"
  ON "Organization" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "Organization___addressSort_idx"
  ON "Organization" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "Organization___addressCitySort_idx"
  ON "Organization" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "Organization___addressCountrySort_idx"
  ON "Organization" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "Organization___addressPostalcodeSort_idx"
  ON "Organization" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "Organization___addressStateSort_idx"
  ON "Organization" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "Organization___addressUseSort_idx"
  ON "Organization" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "Organization_endpoint_idx"
  ON "Organization" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "Organization___identifier_idx"
  ON "Organization" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Organization___nameSort_idx"
  ON "Organization" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Organization_partof_idx"
  ON "Organization" USING btree ("partof");

CREATE INDEX IF NOT EXISTS "Organization___phoneticSort_idx"
  ON "Organization" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "Organization___type_idx"
  ON "Organization" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Organization___sharedTokens_idx"
  ON "Organization" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Organization___activeText_trgm_idx"
  ON "Organization" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Organization___identifierText_trgm_idx"
  ON "Organization" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Organization___typeText_trgm_idx"
  ON "Organization" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Organization____tagText_trgm_idx"
  ON "Organization" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Organization___sharedTokensText_trgm_idx"
  ON "Organization" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Organization_History_id_idx"
  ON "Organization_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Organization_History_lastUpdated_idx"
  ON "Organization_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Organization_References_targetId_code_idx"
  ON "Organization_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_lastUpdated_idx"
  ON "OrganizationAffiliation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_projectId_lastUpdated_idx"
  ON "OrganizationAffiliation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_projectId_idx"
  ON "OrganizationAffiliation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation__source_idx"
  ON "OrganizationAffiliation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_profile_idx"
  ON "OrganizationAffiliation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___version_idx"
  ON "OrganizationAffiliation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_reindex_idx"
  ON "OrganizationAffiliation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_compartments_idx"
  ON "OrganizationAffiliation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___active_idx"
  ON "OrganizationAffiliation" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_date_idx"
  ON "OrganizationAffiliation" USING btree ("date");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___emailSort_idx"
  ON "OrganizationAffiliation" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_endpoint_idx"
  ON "OrganizationAffiliation" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___identifier_idx"
  ON "OrganizationAffiliation" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_location_idx"
  ON "OrganizationAffiliation" USING gin ("location");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_network_idx"
  ON "OrganizationAffiliation" USING gin ("network");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_participatingOrganization_idx"
  ON "OrganizationAffiliation" USING btree ("participatingOrganization");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___phoneSort_idx"
  ON "OrganizationAffiliation" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_primaryOrganization_idx"
  ON "OrganizationAffiliation" USING btree ("primaryOrganization");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___role_idx"
  ON "OrganizationAffiliation" USING gin ("__role");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_service_idx"
  ON "OrganizationAffiliation" USING gin ("service");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___specialty_idx"
  ON "OrganizationAffiliation" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___telecomSort_idx"
  ON "OrganizationAffiliation" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___sharedTokens_idx"
  ON "OrganizationAffiliation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___activeText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___identifierText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___roleText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("__roleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___specialtyText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation____tagText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation___sharedTokensText_trgm_idx"
  ON "OrganizationAffiliation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_History_id_idx"
  ON "OrganizationAffiliation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_History_lastUpdated_idx"
  ON "OrganizationAffiliation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "OrganizationAffiliation_References_targetId_code_idx"
  ON "OrganizationAffiliation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Parameters_lastUpdated_idx"
  ON "Parameters" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Parameters_projectId_lastUpdated_idx"
  ON "Parameters" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Parameters_projectId_idx"
  ON "Parameters" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Parameters__source_idx"
  ON "Parameters" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Parameters_profile_idx"
  ON "Parameters" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Parameters___version_idx"
  ON "Parameters" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Parameters_reindex_idx"
  ON "Parameters" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Parameters_compartments_idx"
  ON "Parameters" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Parameters___sharedTokens_idx"
  ON "Parameters" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Parameters____tagText_trgm_idx"
  ON "Parameters" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Parameters___sharedTokensText_trgm_idx"
  ON "Parameters" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Parameters_History_id_idx"
  ON "Parameters_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Parameters_History_lastUpdated_idx"
  ON "Parameters_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Parameters_References_targetId_code_idx"
  ON "Parameters_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Patient_lastUpdated_idx"
  ON "Patient" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Patient_projectId_lastUpdated_idx"
  ON "Patient" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Patient_projectId_idx"
  ON "Patient" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Patient__source_idx"
  ON "Patient" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Patient_profile_idx"
  ON "Patient" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Patient___version_idx"
  ON "Patient" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Patient_reindex_idx"
  ON "Patient" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Patient_compartments_idx"
  ON "Patient" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Patient___active_idx"
  ON "Patient" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "Patient___addressSort_idx"
  ON "Patient" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "Patient___addressCitySort_idx"
  ON "Patient" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "Patient___addressCountrySort_idx"
  ON "Patient" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "Patient___addressPostalcodeSort_idx"
  ON "Patient" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "Patient___addressStateSort_idx"
  ON "Patient" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "Patient___addressUseSort_idx"
  ON "Patient" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "Patient_birthdate_idx"
  ON "Patient" USING btree ("birthdate");

CREATE INDEX IF NOT EXISTS "Patient_deathDate_idx"
  ON "Patient" USING btree ("deathDate");

CREATE INDEX IF NOT EXISTS "Patient___deceased_idx"
  ON "Patient" USING gin ("__deceased");

CREATE INDEX IF NOT EXISTS "Patient___emailSort_idx"
  ON "Patient" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "Patient___familySort_idx"
  ON "Patient" USING btree ("__familySort");

CREATE INDEX IF NOT EXISTS "Patient___gender_idx"
  ON "Patient" USING gin ("__gender");

CREATE INDEX IF NOT EXISTS "Patient_generalPractitioner_idx"
  ON "Patient" USING gin ("generalPractitioner");

CREATE INDEX IF NOT EXISTS "Patient___givenSort_idx"
  ON "Patient" USING btree ("__givenSort");

CREATE INDEX IF NOT EXISTS "Patient___identifier_idx"
  ON "Patient" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Patient___language_idx"
  ON "Patient" USING gin ("__language");

CREATE INDEX IF NOT EXISTS "Patient_link_idx"
  ON "Patient" USING gin ("link");

CREATE INDEX IF NOT EXISTS "Patient___nameSort_idx"
  ON "Patient" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Patient_organization_idx"
  ON "Patient" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "Patient___phoneSort_idx"
  ON "Patient" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "Patient___phoneticSort_idx"
  ON "Patient" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "Patient___telecomSort_idx"
  ON "Patient" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "Patient___sharedTokens_idx"
  ON "Patient" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Patient___activeText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient___deceasedText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__deceasedText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient___genderText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__genderText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient___identifierText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient___languageText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__languageText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient____tagText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient___sharedTokensText_trgm_idx"
  ON "Patient" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Patient_History_id_idx"
  ON "Patient_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Patient_History_lastUpdated_idx"
  ON "Patient_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Patient_References_targetId_code_idx"
  ON "Patient_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "PaymentNotice_lastUpdated_idx"
  ON "PaymentNotice" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentNotice_projectId_lastUpdated_idx"
  ON "PaymentNotice" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentNotice_projectId_idx"
  ON "PaymentNotice" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "PaymentNotice__source_idx"
  ON "PaymentNotice" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "PaymentNotice_profile_idx"
  ON "PaymentNotice" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "PaymentNotice___version_idx"
  ON "PaymentNotice" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "PaymentNotice_reindex_idx"
  ON "PaymentNotice" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "PaymentNotice_compartments_idx"
  ON "PaymentNotice" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "PaymentNotice_created_idx"
  ON "PaymentNotice" USING btree ("created");

CREATE INDEX IF NOT EXISTS "PaymentNotice___identifier_idx"
  ON "PaymentNotice" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "PaymentNotice___paymentStatus_idx"
  ON "PaymentNotice" USING gin ("__paymentStatus");

CREATE INDEX IF NOT EXISTS "PaymentNotice_provider_idx"
  ON "PaymentNotice" USING btree ("provider");

CREATE INDEX IF NOT EXISTS "PaymentNotice_request_idx"
  ON "PaymentNotice" USING btree ("request");

CREATE INDEX IF NOT EXISTS "PaymentNotice_response_idx"
  ON "PaymentNotice" USING btree ("response");

CREATE INDEX IF NOT EXISTS "PaymentNotice___status_idx"
  ON "PaymentNotice" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "PaymentNotice___sharedTokens_idx"
  ON "PaymentNotice" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "PaymentNotice___identifierText_trgm_idx"
  ON "PaymentNotice" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentNotice___paymentStatusText_trgm_idx"
  ON "PaymentNotice" USING gin (token_array_to_text("__paymentStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentNotice___statusText_trgm_idx"
  ON "PaymentNotice" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentNotice____tagText_trgm_idx"
  ON "PaymentNotice" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentNotice___sharedTokensText_trgm_idx"
  ON "PaymentNotice" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentNotice_History_id_idx"
  ON "PaymentNotice_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "PaymentNotice_History_lastUpdated_idx"
  ON "PaymentNotice_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentNotice_References_targetId_code_idx"
  ON "PaymentNotice_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_lastUpdated_idx"
  ON "PaymentReconciliation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_projectId_lastUpdated_idx"
  ON "PaymentReconciliation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_projectId_idx"
  ON "PaymentReconciliation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation__source_idx"
  ON "PaymentReconciliation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_profile_idx"
  ON "PaymentReconciliation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___version_idx"
  ON "PaymentReconciliation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_reindex_idx"
  ON "PaymentReconciliation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_compartments_idx"
  ON "PaymentReconciliation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_created_idx"
  ON "PaymentReconciliation" USING btree ("created");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_disposition_idx"
  ON "PaymentReconciliation" USING btree ("disposition");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___identifier_idx"
  ON "PaymentReconciliation" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___outcome_idx"
  ON "PaymentReconciliation" USING gin ("__outcome");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_paymentIssuer_idx"
  ON "PaymentReconciliation" USING btree ("paymentIssuer");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_request_idx"
  ON "PaymentReconciliation" USING btree ("request");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_requestor_idx"
  ON "PaymentReconciliation" USING btree ("requestor");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___status_idx"
  ON "PaymentReconciliation" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___sharedTokens_idx"
  ON "PaymentReconciliation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___identifierText_trgm_idx"
  ON "PaymentReconciliation" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___outcomeText_trgm_idx"
  ON "PaymentReconciliation" USING gin (token_array_to_text("__outcomeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___statusText_trgm_idx"
  ON "PaymentReconciliation" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentReconciliation____tagText_trgm_idx"
  ON "PaymentReconciliation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentReconciliation___sharedTokensText_trgm_idx"
  ON "PaymentReconciliation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_History_id_idx"
  ON "PaymentReconciliation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_History_lastUpdated_idx"
  ON "PaymentReconciliation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PaymentReconciliation_References_targetId_code_idx"
  ON "PaymentReconciliation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Person_lastUpdated_idx"
  ON "Person" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Person_projectId_lastUpdated_idx"
  ON "Person" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Person_projectId_idx"
  ON "Person" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Person__source_idx"
  ON "Person" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Person_profile_idx"
  ON "Person" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Person___version_idx"
  ON "Person" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Person_reindex_idx"
  ON "Person" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Person_compartments_idx"
  ON "Person" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Person___addressSort_idx"
  ON "Person" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "Person___addressCitySort_idx"
  ON "Person" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "Person___addressCountrySort_idx"
  ON "Person" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "Person___addressPostalcodeSort_idx"
  ON "Person" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "Person___addressStateSort_idx"
  ON "Person" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "Person___addressUseSort_idx"
  ON "Person" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "Person_birthdate_idx"
  ON "Person" USING btree ("birthdate");

CREATE INDEX IF NOT EXISTS "Person___emailSort_idx"
  ON "Person" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "Person___gender_idx"
  ON "Person" USING gin ("__gender");

CREATE INDEX IF NOT EXISTS "Person___identifier_idx"
  ON "Person" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Person_link_idx"
  ON "Person" USING gin ("link");

CREATE INDEX IF NOT EXISTS "Person___nameSort_idx"
  ON "Person" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Person_organization_idx"
  ON "Person" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "Person_patient_idx"
  ON "Person" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "Person___phoneSort_idx"
  ON "Person" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "Person___phoneticSort_idx"
  ON "Person" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "Person_practitioner_idx"
  ON "Person" USING gin ("practitioner");

CREATE INDEX IF NOT EXISTS "Person_relatedperson_idx"
  ON "Person" USING gin ("relatedperson");

CREATE INDEX IF NOT EXISTS "Person___telecomSort_idx"
  ON "Person" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "Person___sharedTokens_idx"
  ON "Person" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Person___genderText_trgm_idx"
  ON "Person" USING gin (token_array_to_text("__genderText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Person___identifierText_trgm_idx"
  ON "Person" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Person____tagText_trgm_idx"
  ON "Person" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Person___sharedTokensText_trgm_idx"
  ON "Person" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Person_History_id_idx"
  ON "Person_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Person_History_lastUpdated_idx"
  ON "Person_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Person_References_targetId_code_idx"
  ON "Person_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "PlanDefinition_lastUpdated_idx"
  ON "PlanDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PlanDefinition_projectId_lastUpdated_idx"
  ON "PlanDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "PlanDefinition_projectId_idx"
  ON "PlanDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "PlanDefinition__source_idx"
  ON "PlanDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "PlanDefinition_profile_idx"
  ON "PlanDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "PlanDefinition___version_idx"
  ON "PlanDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "PlanDefinition_reindex_idx"
  ON "PlanDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "PlanDefinition_compartments_idx"
  ON "PlanDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "PlanDefinition_composedOf_idx"
  ON "PlanDefinition" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "PlanDefinition___context_idx"
  ON "PlanDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "PlanDefinition_contextQuantity_idx"
  ON "PlanDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "PlanDefinition___contextType_idx"
  ON "PlanDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "PlanDefinition_date_idx"
  ON "PlanDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "PlanDefinition_definition_idx"
  ON "PlanDefinition" USING gin ("definition");

CREATE INDEX IF NOT EXISTS "PlanDefinition_dependsOn_idx"
  ON "PlanDefinition" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "PlanDefinition_derivedFrom_idx"
  ON "PlanDefinition" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "PlanDefinition_description_idx"
  ON "PlanDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "PlanDefinition_effective_idx"
  ON "PlanDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "PlanDefinition___identifier_idx"
  ON "PlanDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "PlanDefinition___jurisdiction_idx"
  ON "PlanDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "PlanDefinition___nameSort_idx"
  ON "PlanDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "PlanDefinition_predecessor_idx"
  ON "PlanDefinition" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "PlanDefinition_publisher_idx"
  ON "PlanDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "PlanDefinition___status_idx"
  ON "PlanDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "PlanDefinition_successor_idx"
  ON "PlanDefinition" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "PlanDefinition_title_idx"
  ON "PlanDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "PlanDefinition___topic_idx"
  ON "PlanDefinition" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "PlanDefinition___type_idx"
  ON "PlanDefinition" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "PlanDefinition_url_idx"
  ON "PlanDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "PlanDefinition_version_idx"
  ON "PlanDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "PlanDefinition___sharedTokens_idx"
  ON "PlanDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "PlanDefinition___contextText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___contextTypeText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___identifierText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___jurisdictionText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___statusText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___topicText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___typeText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition____tagText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition___sharedTokensText_trgm_idx"
  ON "PlanDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PlanDefinition_History_id_idx"
  ON "PlanDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "PlanDefinition_History_lastUpdated_idx"
  ON "PlanDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PlanDefinition_References_targetId_code_idx"
  ON "PlanDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Practitioner_lastUpdated_idx"
  ON "Practitioner" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Practitioner_projectId_lastUpdated_idx"
  ON "Practitioner" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Practitioner_projectId_idx"
  ON "Practitioner" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Practitioner__source_idx"
  ON "Practitioner" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Practitioner_profile_idx"
  ON "Practitioner" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Practitioner___version_idx"
  ON "Practitioner" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Practitioner_reindex_idx"
  ON "Practitioner" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Practitioner_compartments_idx"
  ON "Practitioner" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Practitioner___active_idx"
  ON "Practitioner" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "Practitioner___addressSort_idx"
  ON "Practitioner" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "Practitioner___addressCitySort_idx"
  ON "Practitioner" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "Practitioner___addressCountrySort_idx"
  ON "Practitioner" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "Practitioner___addressPostalcodeSort_idx"
  ON "Practitioner" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "Practitioner___addressStateSort_idx"
  ON "Practitioner" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "Practitioner___addressUseSort_idx"
  ON "Practitioner" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "Practitioner___communication_idx"
  ON "Practitioner" USING gin ("__communication");

CREATE INDEX IF NOT EXISTS "Practitioner___emailSort_idx"
  ON "Practitioner" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "Practitioner___familySort_idx"
  ON "Practitioner" USING btree ("__familySort");

CREATE INDEX IF NOT EXISTS "Practitioner___gender_idx"
  ON "Practitioner" USING gin ("__gender");

CREATE INDEX IF NOT EXISTS "Practitioner___givenSort_idx"
  ON "Practitioner" USING btree ("__givenSort");

CREATE INDEX IF NOT EXISTS "Practitioner___identifier_idx"
  ON "Practitioner" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Practitioner___nameSort_idx"
  ON "Practitioner" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Practitioner___phoneSort_idx"
  ON "Practitioner" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "Practitioner___phoneticSort_idx"
  ON "Practitioner" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "Practitioner___telecomSort_idx"
  ON "Practitioner" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "Practitioner___sharedTokens_idx"
  ON "Practitioner" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Practitioner___activeText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner___communicationText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("__communicationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner___genderText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("__genderText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner___identifierText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner____tagText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner___sharedTokensText_trgm_idx"
  ON "Practitioner" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Practitioner_History_id_idx"
  ON "Practitioner_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Practitioner_History_lastUpdated_idx"
  ON "Practitioner_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Practitioner_References_targetId_code_idx"
  ON "Practitioner_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "PractitionerRole_lastUpdated_idx"
  ON "PractitionerRole" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PractitionerRole_projectId_lastUpdated_idx"
  ON "PractitionerRole" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "PractitionerRole_projectId_idx"
  ON "PractitionerRole" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "PractitionerRole__source_idx"
  ON "PractitionerRole" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "PractitionerRole_profile_idx"
  ON "PractitionerRole" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "PractitionerRole___version_idx"
  ON "PractitionerRole" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "PractitionerRole_reindex_idx"
  ON "PractitionerRole" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "PractitionerRole_compartments_idx"
  ON "PractitionerRole" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "PractitionerRole___active_idx"
  ON "PractitionerRole" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "PractitionerRole_date_idx"
  ON "PractitionerRole" USING btree ("date");

CREATE INDEX IF NOT EXISTS "PractitionerRole___emailSort_idx"
  ON "PractitionerRole" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "PractitionerRole_endpoint_idx"
  ON "PractitionerRole" USING gin ("endpoint");

CREATE INDEX IF NOT EXISTS "PractitionerRole___identifier_idx"
  ON "PractitionerRole" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "PractitionerRole_location_idx"
  ON "PractitionerRole" USING gin ("location");

CREATE INDEX IF NOT EXISTS "PractitionerRole_organization_idx"
  ON "PractitionerRole" USING btree ("organization");

CREATE INDEX IF NOT EXISTS "PractitionerRole___phoneSort_idx"
  ON "PractitionerRole" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "PractitionerRole_practitioner_idx"
  ON "PractitionerRole" USING btree ("practitioner");

CREATE INDEX IF NOT EXISTS "PractitionerRole___role_idx"
  ON "PractitionerRole" USING gin ("__role");

CREATE INDEX IF NOT EXISTS "PractitionerRole_service_idx"
  ON "PractitionerRole" USING gin ("service");

CREATE INDEX IF NOT EXISTS "PractitionerRole___specialty_idx"
  ON "PractitionerRole" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "PractitionerRole___telecomSort_idx"
  ON "PractitionerRole" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "PractitionerRole___sharedTokens_idx"
  ON "PractitionerRole" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "PractitionerRole___activeText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole___identifierText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole___roleText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("__roleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole___specialtyText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole____tagText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole___sharedTokensText_trgm_idx"
  ON "PractitionerRole" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "PractitionerRole_History_id_idx"
  ON "PractitionerRole_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "PractitionerRole_History_lastUpdated_idx"
  ON "PractitionerRole_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "PractitionerRole_References_targetId_code_idx"
  ON "PractitionerRole_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Procedure_lastUpdated_idx"
  ON "Procedure" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Procedure_projectId_lastUpdated_idx"
  ON "Procedure" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Procedure_projectId_idx"
  ON "Procedure" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Procedure__source_idx"
  ON "Procedure" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Procedure_profile_idx"
  ON "Procedure" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Procedure___version_idx"
  ON "Procedure" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Procedure_reindex_idx"
  ON "Procedure" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Procedure_compartments_idx"
  ON "Procedure" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Procedure_basedOn_idx"
  ON "Procedure" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Procedure___category_idx"
  ON "Procedure" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Procedure___code_idx"
  ON "Procedure" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Procedure_date_idx"
  ON "Procedure" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Procedure_encounter_idx"
  ON "Procedure" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Procedure___identifier_idx"
  ON "Procedure" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Procedure_instantiatesCanonical_idx"
  ON "Procedure" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "Procedure_instantiatesUri_idx"
  ON "Procedure" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "Procedure_location_idx"
  ON "Procedure" USING btree ("location");

CREATE INDEX IF NOT EXISTS "Procedure_partOf_idx"
  ON "Procedure" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "Procedure_patient_idx"
  ON "Procedure" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Procedure_performer_idx"
  ON "Procedure" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "Procedure___reasonCode_idx"
  ON "Procedure" USING gin ("__reasonCode");

CREATE INDEX IF NOT EXISTS "Procedure_reasonReference_idx"
  ON "Procedure" USING gin ("reasonReference");

CREATE INDEX IF NOT EXISTS "Procedure___status_idx"
  ON "Procedure" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Procedure_subject_idx"
  ON "Procedure" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Procedure___sharedTokens_idx"
  ON "Procedure" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Procedure___categoryText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure___codeText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure___identifierText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure___reasonCodeText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__reasonCodeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure___statusText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure____tagText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure___sharedTokensText_trgm_idx"
  ON "Procedure" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Procedure_History_id_idx"
  ON "Procedure_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Procedure_History_lastUpdated_idx"
  ON "Procedure_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Procedure_References_targetId_code_idx"
  ON "Procedure_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Provenance_lastUpdated_idx"
  ON "Provenance" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Provenance_projectId_lastUpdated_idx"
  ON "Provenance" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Provenance_projectId_idx"
  ON "Provenance" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Provenance__source_idx"
  ON "Provenance" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Provenance_profile_idx"
  ON "Provenance" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Provenance___version_idx"
  ON "Provenance" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Provenance_reindex_idx"
  ON "Provenance" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Provenance_compartments_idx"
  ON "Provenance" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Provenance_agent_idx"
  ON "Provenance" USING gin ("agent");

CREATE INDEX IF NOT EXISTS "Provenance___agentRole_idx"
  ON "Provenance" USING gin ("__agentRole");

CREATE INDEX IF NOT EXISTS "Provenance___agentType_idx"
  ON "Provenance" USING gin ("__agentType");

CREATE INDEX IF NOT EXISTS "Provenance_entity_idx"
  ON "Provenance" USING gin ("entity");

CREATE INDEX IF NOT EXISTS "Provenance_location_idx"
  ON "Provenance" USING btree ("location");

CREATE INDEX IF NOT EXISTS "Provenance_patient_idx"
  ON "Provenance" USING gin ("patient");

CREATE INDEX IF NOT EXISTS "Provenance_recorded_idx"
  ON "Provenance" USING btree ("recorded");

CREATE INDEX IF NOT EXISTS "Provenance___signatureType_idx"
  ON "Provenance" USING gin ("__signatureType");

CREATE INDEX IF NOT EXISTS "Provenance_target_idx"
  ON "Provenance" USING gin ("target");

CREATE INDEX IF NOT EXISTS "Provenance_when_idx"
  ON "Provenance" USING btree ("when");

CREATE INDEX IF NOT EXISTS "Provenance___sharedTokens_idx"
  ON "Provenance" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Provenance___agentRoleText_trgm_idx"
  ON "Provenance" USING gin (token_array_to_text("__agentRoleText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Provenance___agentTypeText_trgm_idx"
  ON "Provenance" USING gin (token_array_to_text("__agentTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Provenance___signatureTypeText_trgm_idx"
  ON "Provenance" USING gin (token_array_to_text("__signatureTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Provenance____tagText_trgm_idx"
  ON "Provenance" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Provenance___sharedTokensText_trgm_idx"
  ON "Provenance" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Provenance_History_id_idx"
  ON "Provenance_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Provenance_History_lastUpdated_idx"
  ON "Provenance_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Provenance_References_targetId_code_idx"
  ON "Provenance_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Questionnaire_lastUpdated_idx"
  ON "Questionnaire" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Questionnaire_projectId_lastUpdated_idx"
  ON "Questionnaire" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Questionnaire_projectId_idx"
  ON "Questionnaire" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Questionnaire__source_idx"
  ON "Questionnaire" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Questionnaire_profile_idx"
  ON "Questionnaire" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Questionnaire___version_idx"
  ON "Questionnaire" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Questionnaire_reindex_idx"
  ON "Questionnaire" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Questionnaire_compartments_idx"
  ON "Questionnaire" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Questionnaire___code_idx"
  ON "Questionnaire" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Questionnaire___context_idx"
  ON "Questionnaire" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "Questionnaire_contextQuantity_idx"
  ON "Questionnaire" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "Questionnaire___contextType_idx"
  ON "Questionnaire" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "Questionnaire_date_idx"
  ON "Questionnaire" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Questionnaire_definition_idx"
  ON "Questionnaire" USING gin ("definition");

CREATE INDEX IF NOT EXISTS "Questionnaire_description_idx"
  ON "Questionnaire" USING btree ("description");

CREATE INDEX IF NOT EXISTS "Questionnaire_effective_idx"
  ON "Questionnaire" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "Questionnaire___identifier_idx"
  ON "Questionnaire" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Questionnaire___jurisdiction_idx"
  ON "Questionnaire" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "Questionnaire___nameSort_idx"
  ON "Questionnaire" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "Questionnaire_publisher_idx"
  ON "Questionnaire" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "Questionnaire___status_idx"
  ON "Questionnaire" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Questionnaire___subjectType_idx"
  ON "Questionnaire" USING gin ("__subjectType");

CREATE INDEX IF NOT EXISTS "Questionnaire_title_idx"
  ON "Questionnaire" USING btree ("title");

CREATE INDEX IF NOT EXISTS "Questionnaire_url_idx"
  ON "Questionnaire" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Questionnaire_version_idx"
  ON "Questionnaire" USING btree ("version");

CREATE INDEX IF NOT EXISTS "Questionnaire___sharedTokens_idx"
  ON "Questionnaire" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Questionnaire___codeText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___contextText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___contextTypeText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___identifierText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___jurisdictionText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___statusText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___subjectTypeText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__subjectTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire____tagText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire___sharedTokensText_trgm_idx"
  ON "Questionnaire" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Questionnaire_History_id_idx"
  ON "Questionnaire_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Questionnaire_History_lastUpdated_idx"
  ON "Questionnaire_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Questionnaire_References_targetId_code_idx"
  ON "Questionnaire_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_lastUpdated_idx"
  ON "QuestionnaireResponse" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_projectId_lastUpdated_idx"
  ON "QuestionnaireResponse" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_projectId_idx"
  ON "QuestionnaireResponse" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse__source_idx"
  ON "QuestionnaireResponse" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_profile_idx"
  ON "QuestionnaireResponse" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___version_idx"
  ON "QuestionnaireResponse" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_reindex_idx"
  ON "QuestionnaireResponse" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_compartments_idx"
  ON "QuestionnaireResponse" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_author_idx"
  ON "QuestionnaireResponse" USING btree ("author");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_authored_idx"
  ON "QuestionnaireResponse" USING btree ("authored");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_basedOn_idx"
  ON "QuestionnaireResponse" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_encounter_idx"
  ON "QuestionnaireResponse" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___identifier_idx"
  ON "QuestionnaireResponse" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_partOf_idx"
  ON "QuestionnaireResponse" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_patient_idx"
  ON "QuestionnaireResponse" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_questionnaire_idx"
  ON "QuestionnaireResponse" USING btree ("questionnaire");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_source_idx"
  ON "QuestionnaireResponse" USING btree ("source");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___status_idx"
  ON "QuestionnaireResponse" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_subject_idx"
  ON "QuestionnaireResponse" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___sharedTokens_idx"
  ON "QuestionnaireResponse" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___identifierText_trgm_idx"
  ON "QuestionnaireResponse" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___statusText_trgm_idx"
  ON "QuestionnaireResponse" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse____tagText_trgm_idx"
  ON "QuestionnaireResponse" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse___sharedTokensText_trgm_idx"
  ON "QuestionnaireResponse" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_History_id_idx"
  ON "QuestionnaireResponse_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_History_lastUpdated_idx"
  ON "QuestionnaireResponse_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "QuestionnaireResponse_References_targetId_code_idx"
  ON "QuestionnaireResponse_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "RelatedPerson_lastUpdated_idx"
  ON "RelatedPerson" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RelatedPerson_projectId_lastUpdated_idx"
  ON "RelatedPerson" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "RelatedPerson_projectId_idx"
  ON "RelatedPerson" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "RelatedPerson__source_idx"
  ON "RelatedPerson" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "RelatedPerson_profile_idx"
  ON "RelatedPerson" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "RelatedPerson___version_idx"
  ON "RelatedPerson" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "RelatedPerson_reindex_idx"
  ON "RelatedPerson" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "RelatedPerson_compartments_idx"
  ON "RelatedPerson" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "RelatedPerson___active_idx"
  ON "RelatedPerson" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressSort_idx"
  ON "RelatedPerson" USING btree ("__addressSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressCitySort_idx"
  ON "RelatedPerson" USING btree ("__addressCitySort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressCountrySort_idx"
  ON "RelatedPerson" USING btree ("__addressCountrySort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressPostalcodeSort_idx"
  ON "RelatedPerson" USING btree ("__addressPostalcodeSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressStateSort_idx"
  ON "RelatedPerson" USING btree ("__addressStateSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___addressUseSort_idx"
  ON "RelatedPerson" USING btree ("__addressUseSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson_birthdate_idx"
  ON "RelatedPerson" USING btree ("birthdate");

CREATE INDEX IF NOT EXISTS "RelatedPerson___emailSort_idx"
  ON "RelatedPerson" USING btree ("__emailSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___gender_idx"
  ON "RelatedPerson" USING gin ("__gender");

CREATE INDEX IF NOT EXISTS "RelatedPerson___identifier_idx"
  ON "RelatedPerson" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "RelatedPerson___nameSort_idx"
  ON "RelatedPerson" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson_patient_idx"
  ON "RelatedPerson" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "RelatedPerson___phoneSort_idx"
  ON "RelatedPerson" USING btree ("__phoneSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___phoneticSort_idx"
  ON "RelatedPerson" USING btree ("__phoneticSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___relationship_idx"
  ON "RelatedPerson" USING gin ("__relationship");

CREATE INDEX IF NOT EXISTS "RelatedPerson___telecomSort_idx"
  ON "RelatedPerson" USING btree ("__telecomSort");

CREATE INDEX IF NOT EXISTS "RelatedPerson___sharedTokens_idx"
  ON "RelatedPerson" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "RelatedPerson___activeText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson___genderText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("__genderText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson___identifierText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson___relationshipText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("__relationshipText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson____tagText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson___sharedTokensText_trgm_idx"
  ON "RelatedPerson" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RelatedPerson_History_id_idx"
  ON "RelatedPerson_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "RelatedPerson_History_lastUpdated_idx"
  ON "RelatedPerson_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RelatedPerson_References_targetId_code_idx"
  ON "RelatedPerson_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "RequestGroup_lastUpdated_idx"
  ON "RequestGroup" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RequestGroup_projectId_lastUpdated_idx"
  ON "RequestGroup" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "RequestGroup_projectId_idx"
  ON "RequestGroup" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "RequestGroup__source_idx"
  ON "RequestGroup" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "RequestGroup_profile_idx"
  ON "RequestGroup" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "RequestGroup___version_idx"
  ON "RequestGroup" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "RequestGroup_reindex_idx"
  ON "RequestGroup" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "RequestGroup_compartments_idx"
  ON "RequestGroup" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "RequestGroup_author_idx"
  ON "RequestGroup" USING btree ("author");

CREATE INDEX IF NOT EXISTS "RequestGroup_authored_idx"
  ON "RequestGroup" USING btree ("authored");

CREATE INDEX IF NOT EXISTS "RequestGroup___code_idx"
  ON "RequestGroup" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "RequestGroup_encounter_idx"
  ON "RequestGroup" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "RequestGroup___groupIdentifier_idx"
  ON "RequestGroup" USING gin ("__groupIdentifier");

CREATE INDEX IF NOT EXISTS "RequestGroup___identifier_idx"
  ON "RequestGroup" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "RequestGroup_instantiatesCanonical_idx"
  ON "RequestGroup" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "RequestGroup_instantiatesUri_idx"
  ON "RequestGroup" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "RequestGroup___intent_idx"
  ON "RequestGroup" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "RequestGroup_participant_idx"
  ON "RequestGroup" USING gin ("participant");

CREATE INDEX IF NOT EXISTS "RequestGroup_patient_idx"
  ON "RequestGroup" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "RequestGroup___priority_idx"
  ON "RequestGroup" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "RequestGroup___status_idx"
  ON "RequestGroup" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "RequestGroup_subject_idx"
  ON "RequestGroup" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "RequestGroup___sharedTokens_idx"
  ON "RequestGroup" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "RequestGroup___codeText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___groupIdentifierText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__groupIdentifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___identifierText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___intentText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___priorityText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___statusText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup____tagText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup___sharedTokensText_trgm_idx"
  ON "RequestGroup" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RequestGroup_History_id_idx"
  ON "RequestGroup_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "RequestGroup_History_lastUpdated_idx"
  ON "RequestGroup_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RequestGroup_References_targetId_code_idx"
  ON "RequestGroup_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_lastUpdated_idx"
  ON "ResearchDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_projectId_lastUpdated_idx"
  ON "ResearchDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_projectId_idx"
  ON "ResearchDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ResearchDefinition__source_idx"
  ON "ResearchDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_profile_idx"
  ON "ResearchDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___version_idx"
  ON "ResearchDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_reindex_idx"
  ON "ResearchDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ResearchDefinition_compartments_idx"
  ON "ResearchDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_composedOf_idx"
  ON "ResearchDefinition" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___context_idx"
  ON "ResearchDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_contextQuantity_idx"
  ON "ResearchDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___contextType_idx"
  ON "ResearchDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_date_idx"
  ON "ResearchDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_dependsOn_idx"
  ON "ResearchDefinition" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_derivedFrom_idx"
  ON "ResearchDefinition" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_description_idx"
  ON "ResearchDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_effective_idx"
  ON "ResearchDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___identifier_idx"
  ON "ResearchDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___jurisdiction_idx"
  ON "ResearchDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___nameSort_idx"
  ON "ResearchDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_predecessor_idx"
  ON "ResearchDefinition" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_publisher_idx"
  ON "ResearchDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___status_idx"
  ON "ResearchDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_successor_idx"
  ON "ResearchDefinition" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_title_idx"
  ON "ResearchDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___topic_idx"
  ON "ResearchDefinition" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_url_idx"
  ON "ResearchDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_version_idx"
  ON "ResearchDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___sharedTokens_idx"
  ON "ResearchDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ResearchDefinition___contextText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___contextTypeText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___identifierText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___jurisdictionText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___statusText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___topicText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition____tagText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition___sharedTokensText_trgm_idx"
  ON "ResearchDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchDefinition_History_id_idx"
  ON "ResearchDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_History_lastUpdated_idx"
  ON "ResearchDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchDefinition_References_targetId_code_idx"
  ON "ResearchDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_lastUpdated_idx"
  ON "ResearchElementDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_projectId_lastUpdated_idx"
  ON "ResearchElementDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_projectId_idx"
  ON "ResearchElementDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition__source_idx"
  ON "ResearchElementDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_profile_idx"
  ON "ResearchElementDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___version_idx"
  ON "ResearchElementDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_reindex_idx"
  ON "ResearchElementDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_compartments_idx"
  ON "ResearchElementDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_composedOf_idx"
  ON "ResearchElementDefinition" USING gin ("composedOf");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___context_idx"
  ON "ResearchElementDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_contextQuantity_idx"
  ON "ResearchElementDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___contextType_idx"
  ON "ResearchElementDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_date_idx"
  ON "ResearchElementDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_dependsOn_idx"
  ON "ResearchElementDefinition" USING gin ("dependsOn");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_derivedFrom_idx"
  ON "ResearchElementDefinition" USING gin ("derivedFrom");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_description_idx"
  ON "ResearchElementDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_effective_idx"
  ON "ResearchElementDefinition" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___identifier_idx"
  ON "ResearchElementDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___jurisdiction_idx"
  ON "ResearchElementDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___nameSort_idx"
  ON "ResearchElementDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_predecessor_idx"
  ON "ResearchElementDefinition" USING gin ("predecessor");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_publisher_idx"
  ON "ResearchElementDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___status_idx"
  ON "ResearchElementDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_successor_idx"
  ON "ResearchElementDefinition" USING gin ("successor");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_title_idx"
  ON "ResearchElementDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___topic_idx"
  ON "ResearchElementDefinition" USING gin ("__topic");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_url_idx"
  ON "ResearchElementDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_version_idx"
  ON "ResearchElementDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___sharedTokens_idx"
  ON "ResearchElementDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___contextText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___contextTypeText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___identifierText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___jurisdictionText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___statusText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___topicText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__topicText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition____tagText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition___sharedTokensText_trgm_idx"
  ON "ResearchElementDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_History_id_idx"
  ON "ResearchElementDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_History_lastUpdated_idx"
  ON "ResearchElementDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchElementDefinition_References_targetId_code_idx"
  ON "ResearchElementDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ResearchStudy_lastUpdated_idx"
  ON "ResearchStudy" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchStudy_projectId_lastUpdated_idx"
  ON "ResearchStudy" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchStudy_projectId_idx"
  ON "ResearchStudy" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ResearchStudy__source_idx"
  ON "ResearchStudy" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ResearchStudy_profile_idx"
  ON "ResearchStudy" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ResearchStudy___version_idx"
  ON "ResearchStudy" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ResearchStudy_reindex_idx"
  ON "ResearchStudy" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ResearchStudy_compartments_idx"
  ON "ResearchStudy" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ResearchStudy___category_idx"
  ON "ResearchStudy" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "ResearchStudy_date_idx"
  ON "ResearchStudy" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ResearchStudy___focus_idx"
  ON "ResearchStudy" USING gin ("__focus");

CREATE INDEX IF NOT EXISTS "ResearchStudy___identifier_idx"
  ON "ResearchStudy" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ResearchStudy___keyword_idx"
  ON "ResearchStudy" USING gin ("__keyword");

CREATE INDEX IF NOT EXISTS "ResearchStudy___location_idx"
  ON "ResearchStudy" USING gin ("__location");

CREATE INDEX IF NOT EXISTS "ResearchStudy_partof_idx"
  ON "ResearchStudy" USING gin ("partof");

CREATE INDEX IF NOT EXISTS "ResearchStudy_principalinvestigator_idx"
  ON "ResearchStudy" USING btree ("principalinvestigator");

CREATE INDEX IF NOT EXISTS "ResearchStudy_protocol_idx"
  ON "ResearchStudy" USING gin ("protocol");

CREATE INDEX IF NOT EXISTS "ResearchStudy_site_idx"
  ON "ResearchStudy" USING gin ("site");

CREATE INDEX IF NOT EXISTS "ResearchStudy_sponsor_idx"
  ON "ResearchStudy" USING btree ("sponsor");

CREATE INDEX IF NOT EXISTS "ResearchStudy___status_idx"
  ON "ResearchStudy" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ResearchStudy_title_idx"
  ON "ResearchStudy" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ResearchStudy___sharedTokens_idx"
  ON "ResearchStudy" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ResearchStudy___categoryText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___focusText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__focusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___identifierText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___keywordText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__keywordText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___locationText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__locationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___statusText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy____tagText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy___sharedTokensText_trgm_idx"
  ON "ResearchStudy" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchStudy_History_id_idx"
  ON "ResearchStudy_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ResearchStudy_History_lastUpdated_idx"
  ON "ResearchStudy_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchStudy_References_targetId_code_idx"
  ON "ResearchStudy_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ResearchSubject_lastUpdated_idx"
  ON "ResearchSubject" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchSubject_projectId_lastUpdated_idx"
  ON "ResearchSubject" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchSubject_projectId_idx"
  ON "ResearchSubject" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ResearchSubject__source_idx"
  ON "ResearchSubject" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ResearchSubject_profile_idx"
  ON "ResearchSubject" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ResearchSubject___version_idx"
  ON "ResearchSubject" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ResearchSubject_reindex_idx"
  ON "ResearchSubject" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ResearchSubject_compartments_idx"
  ON "ResearchSubject" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ResearchSubject_date_idx"
  ON "ResearchSubject" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ResearchSubject___identifier_idx"
  ON "ResearchSubject" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ResearchSubject_individual_idx"
  ON "ResearchSubject" USING btree ("individual");

CREATE INDEX IF NOT EXISTS "ResearchSubject_patient_idx"
  ON "ResearchSubject" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ResearchSubject___status_idx"
  ON "ResearchSubject" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ResearchSubject_study_idx"
  ON "ResearchSubject" USING btree ("study");

CREATE INDEX IF NOT EXISTS "ResearchSubject___sharedTokens_idx"
  ON "ResearchSubject" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ResearchSubject___identifierText_trgm_idx"
  ON "ResearchSubject" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchSubject___statusText_trgm_idx"
  ON "ResearchSubject" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchSubject____tagText_trgm_idx"
  ON "ResearchSubject" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchSubject___sharedTokensText_trgm_idx"
  ON "ResearchSubject" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ResearchSubject_History_id_idx"
  ON "ResearchSubject_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ResearchSubject_History_lastUpdated_idx"
  ON "ResearchSubject_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ResearchSubject_References_targetId_code_idx"
  ON "ResearchSubject_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "RiskAssessment_lastUpdated_idx"
  ON "RiskAssessment" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskAssessment_projectId_lastUpdated_idx"
  ON "RiskAssessment" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskAssessment_projectId_idx"
  ON "RiskAssessment" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "RiskAssessment__source_idx"
  ON "RiskAssessment" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "RiskAssessment_profile_idx"
  ON "RiskAssessment" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "RiskAssessment___version_idx"
  ON "RiskAssessment" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "RiskAssessment_reindex_idx"
  ON "RiskAssessment" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "RiskAssessment_compartments_idx"
  ON "RiskAssessment" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "RiskAssessment_condition_idx"
  ON "RiskAssessment" USING btree ("condition");

CREATE INDEX IF NOT EXISTS "RiskAssessment_date_idx"
  ON "RiskAssessment" USING btree ("date");

CREATE INDEX IF NOT EXISTS "RiskAssessment_encounter_idx"
  ON "RiskAssessment" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "RiskAssessment___identifier_idx"
  ON "RiskAssessment" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "RiskAssessment___method_idx"
  ON "RiskAssessment" USING gin ("__method");

CREATE INDEX IF NOT EXISTS "RiskAssessment_patient_idx"
  ON "RiskAssessment" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "RiskAssessment_performer_idx"
  ON "RiskAssessment" USING btree ("performer");

CREATE INDEX IF NOT EXISTS "RiskAssessment_probability_idx"
  ON "RiskAssessment" USING gin ("probability");

CREATE INDEX IF NOT EXISTS "RiskAssessment___risk_idx"
  ON "RiskAssessment" USING gin ("__risk");

CREATE INDEX IF NOT EXISTS "RiskAssessment_subject_idx"
  ON "RiskAssessment" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "RiskAssessment___sharedTokens_idx"
  ON "RiskAssessment" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "RiskAssessment___identifierText_trgm_idx"
  ON "RiskAssessment" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskAssessment___methodText_trgm_idx"
  ON "RiskAssessment" USING gin (token_array_to_text("__methodText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskAssessment___riskText_trgm_idx"
  ON "RiskAssessment" USING gin (token_array_to_text("__riskText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskAssessment____tagText_trgm_idx"
  ON "RiskAssessment" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskAssessment___sharedTokensText_trgm_idx"
  ON "RiskAssessment" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskAssessment_History_id_idx"
  ON "RiskAssessment_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "RiskAssessment_History_lastUpdated_idx"
  ON "RiskAssessment_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskAssessment_References_targetId_code_idx"
  ON "RiskAssessment_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_lastUpdated_idx"
  ON "RiskEvidenceSynthesis" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_projectId_lastUpdated_idx"
  ON "RiskEvidenceSynthesis" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_projectId_idx"
  ON "RiskEvidenceSynthesis" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis__source_idx"
  ON "RiskEvidenceSynthesis" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_profile_idx"
  ON "RiskEvidenceSynthesis" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___version_idx"
  ON "RiskEvidenceSynthesis" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_reindex_idx"
  ON "RiskEvidenceSynthesis" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_compartments_idx"
  ON "RiskEvidenceSynthesis" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___context_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_contextQuantity_idx"
  ON "RiskEvidenceSynthesis" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___contextType_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_date_idx"
  ON "RiskEvidenceSynthesis" USING btree ("date");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_description_idx"
  ON "RiskEvidenceSynthesis" USING btree ("description");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_effective_idx"
  ON "RiskEvidenceSynthesis" USING btree ("effective");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___identifier_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___jurisdiction_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___nameSort_idx"
  ON "RiskEvidenceSynthesis" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_publisher_idx"
  ON "RiskEvidenceSynthesis" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___status_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_title_idx"
  ON "RiskEvidenceSynthesis" USING btree ("title");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_url_idx"
  ON "RiskEvidenceSynthesis" USING btree ("url");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_version_idx"
  ON "RiskEvidenceSynthesis" USING btree ("version");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___sharedTokens_idx"
  ON "RiskEvidenceSynthesis" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___contextText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___contextTypeText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___identifierText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___jurisdictionText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___statusText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis____tagText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis___sharedTokensText_trgm_idx"
  ON "RiskEvidenceSynthesis" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_History_id_idx"
  ON "RiskEvidenceSynthesis_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_History_lastUpdated_idx"
  ON "RiskEvidenceSynthesis_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "RiskEvidenceSynthesis_References_targetId_code_idx"
  ON "RiskEvidenceSynthesis_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Schedule_lastUpdated_idx"
  ON "Schedule" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Schedule_projectId_lastUpdated_idx"
  ON "Schedule" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Schedule_projectId_idx"
  ON "Schedule" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Schedule__source_idx"
  ON "Schedule" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Schedule_profile_idx"
  ON "Schedule" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Schedule___version_idx"
  ON "Schedule" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Schedule_reindex_idx"
  ON "Schedule" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Schedule_compartments_idx"
  ON "Schedule" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Schedule___active_idx"
  ON "Schedule" USING gin ("__active");

CREATE INDEX IF NOT EXISTS "Schedule_actor_idx"
  ON "Schedule" USING gin ("actor");

CREATE INDEX IF NOT EXISTS "Schedule_date_idx"
  ON "Schedule" USING btree ("date");

CREATE INDEX IF NOT EXISTS "Schedule___identifier_idx"
  ON "Schedule" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Schedule___serviceCategory_idx"
  ON "Schedule" USING gin ("__serviceCategory");

CREATE INDEX IF NOT EXISTS "Schedule___serviceType_idx"
  ON "Schedule" USING gin ("__serviceType");

CREATE INDEX IF NOT EXISTS "Schedule___specialty_idx"
  ON "Schedule" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "Schedule___sharedTokens_idx"
  ON "Schedule" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Schedule___activeText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__activeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule___identifierText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule___serviceCategoryText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__serviceCategoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule___serviceTypeText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__serviceTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule___specialtyText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule____tagText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule___sharedTokensText_trgm_idx"
  ON "Schedule" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Schedule_History_id_idx"
  ON "Schedule_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Schedule_History_lastUpdated_idx"
  ON "Schedule_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Schedule_References_targetId_code_idx"
  ON "Schedule_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SearchParameter_lastUpdated_idx"
  ON "SearchParameter" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SearchParameter_projectId_lastUpdated_idx"
  ON "SearchParameter" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SearchParameter_projectId_idx"
  ON "SearchParameter" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SearchParameter__source_idx"
  ON "SearchParameter" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SearchParameter_profile_idx"
  ON "SearchParameter" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SearchParameter___version_idx"
  ON "SearchParameter" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SearchParameter_reindex_idx"
  ON "SearchParameter" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SearchParameter_compartments_idx"
  ON "SearchParameter" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SearchParameter___base_idx"
  ON "SearchParameter" USING gin ("__base");

CREATE INDEX IF NOT EXISTS "SearchParameter___code_idx"
  ON "SearchParameter" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "SearchParameter_component_idx"
  ON "SearchParameter" USING gin ("component");

CREATE INDEX IF NOT EXISTS "SearchParameter___context_idx"
  ON "SearchParameter" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "SearchParameter_contextQuantity_idx"
  ON "SearchParameter" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "SearchParameter___contextType_idx"
  ON "SearchParameter" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "SearchParameter_date_idx"
  ON "SearchParameter" USING btree ("date");

CREATE INDEX IF NOT EXISTS "SearchParameter_derivedFrom_idx"
  ON "SearchParameter" USING btree ("derivedFrom");

CREATE INDEX IF NOT EXISTS "SearchParameter_description_idx"
  ON "SearchParameter" USING btree ("description");

CREATE INDEX IF NOT EXISTS "SearchParameter___jurisdiction_idx"
  ON "SearchParameter" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "SearchParameter___nameSort_idx"
  ON "SearchParameter" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "SearchParameter_publisher_idx"
  ON "SearchParameter" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "SearchParameter___status_idx"
  ON "SearchParameter" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "SearchParameter___target_idx"
  ON "SearchParameter" USING gin ("__target");

CREATE INDEX IF NOT EXISTS "SearchParameter___type_idx"
  ON "SearchParameter" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "SearchParameter_url_idx"
  ON "SearchParameter" USING btree ("url");

CREATE INDEX IF NOT EXISTS "SearchParameter_version_idx"
  ON "SearchParameter" USING btree ("version");

CREATE INDEX IF NOT EXISTS "SearchParameter___sharedTokens_idx"
  ON "SearchParameter" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SearchParameter___baseText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__baseText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___codeText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___contextText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___contextTypeText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___jurisdictionText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___statusText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___targetText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__targetText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___typeText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter____tagText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter___sharedTokensText_trgm_idx"
  ON "SearchParameter" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SearchParameter_History_id_idx"
  ON "SearchParameter_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SearchParameter_History_lastUpdated_idx"
  ON "SearchParameter_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SearchParameter_References_targetId_code_idx"
  ON "SearchParameter_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ServiceRequest_lastUpdated_idx"
  ON "ServiceRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ServiceRequest_projectId_lastUpdated_idx"
  ON "ServiceRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ServiceRequest_projectId_idx"
  ON "ServiceRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ServiceRequest__source_idx"
  ON "ServiceRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ServiceRequest_profile_idx"
  ON "ServiceRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ServiceRequest___version_idx"
  ON "ServiceRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ServiceRequest_reindex_idx"
  ON "ServiceRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ServiceRequest_compartments_idx"
  ON "ServiceRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ServiceRequest_authored_idx"
  ON "ServiceRequest" USING btree ("authored");

CREATE INDEX IF NOT EXISTS "ServiceRequest_basedOn_idx"
  ON "ServiceRequest" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "ServiceRequest___bodySite_idx"
  ON "ServiceRequest" USING gin ("__bodySite");

CREATE INDEX IF NOT EXISTS "ServiceRequest___category_idx"
  ON "ServiceRequest" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "ServiceRequest___code_idx"
  ON "ServiceRequest" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "ServiceRequest_encounter_idx"
  ON "ServiceRequest" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "ServiceRequest___identifier_idx"
  ON "ServiceRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ServiceRequest_instantiatesCanonical_idx"
  ON "ServiceRequest" USING gin ("instantiatesCanonical");

CREATE INDEX IF NOT EXISTS "ServiceRequest_instantiatesUri_idx"
  ON "ServiceRequest" USING gin ("instantiatesUri");

CREATE INDEX IF NOT EXISTS "ServiceRequest___intent_idx"
  ON "ServiceRequest" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "ServiceRequest_occurrence_idx"
  ON "ServiceRequest" USING btree ("occurrence");

CREATE INDEX IF NOT EXISTS "ServiceRequest_patient_idx"
  ON "ServiceRequest" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "ServiceRequest_performer_idx"
  ON "ServiceRequest" USING gin ("performer");

CREATE INDEX IF NOT EXISTS "ServiceRequest___performerType_idx"
  ON "ServiceRequest" USING gin ("__performerType");

CREATE INDEX IF NOT EXISTS "ServiceRequest___priority_idx"
  ON "ServiceRequest" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "ServiceRequest_replaces_idx"
  ON "ServiceRequest" USING gin ("replaces");

CREATE INDEX IF NOT EXISTS "ServiceRequest_requester_idx"
  ON "ServiceRequest" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "ServiceRequest___requisition_idx"
  ON "ServiceRequest" USING gin ("__requisition");

CREATE INDEX IF NOT EXISTS "ServiceRequest_specimen_idx"
  ON "ServiceRequest" USING gin ("specimen");

CREATE INDEX IF NOT EXISTS "ServiceRequest___status_idx"
  ON "ServiceRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ServiceRequest_subject_idx"
  ON "ServiceRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "ServiceRequest___sharedTokens_idx"
  ON "ServiceRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ServiceRequest___bodySiteText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__bodySiteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___categoryText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___codeText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___identifierText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___intentText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___performerTypeText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__performerTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___priorityText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___requisitionText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__requisitionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___statusText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest____tagText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest___sharedTokensText_trgm_idx"
  ON "ServiceRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ServiceRequest_History_id_idx"
  ON "ServiceRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ServiceRequest_History_lastUpdated_idx"
  ON "ServiceRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ServiceRequest_References_targetId_code_idx"
  ON "ServiceRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Slot_lastUpdated_idx"
  ON "Slot" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Slot_projectId_lastUpdated_idx"
  ON "Slot" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Slot_projectId_idx"
  ON "Slot" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Slot__source_idx"
  ON "Slot" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Slot_profile_idx"
  ON "Slot" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Slot___version_idx"
  ON "Slot" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Slot_reindex_idx"
  ON "Slot" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Slot_compartments_idx"
  ON "Slot" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Slot___appointmentType_idx"
  ON "Slot" USING gin ("__appointmentType");

CREATE INDEX IF NOT EXISTS "Slot___identifier_idx"
  ON "Slot" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Slot_schedule_idx"
  ON "Slot" USING btree ("schedule");

CREATE INDEX IF NOT EXISTS "Slot___serviceCategory_idx"
  ON "Slot" USING gin ("__serviceCategory");

CREATE INDEX IF NOT EXISTS "Slot___serviceType_idx"
  ON "Slot" USING gin ("__serviceType");

CREATE INDEX IF NOT EXISTS "Slot___specialty_idx"
  ON "Slot" USING gin ("__specialty");

CREATE INDEX IF NOT EXISTS "Slot_start_idx"
  ON "Slot" USING btree ("start");

CREATE INDEX IF NOT EXISTS "Slot___status_idx"
  ON "Slot" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Slot___sharedTokens_idx"
  ON "Slot" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Slot___appointmentTypeText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__appointmentTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___identifierText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___serviceCategoryText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__serviceCategoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___serviceTypeText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__serviceTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___specialtyText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__specialtyText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___statusText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot____tagText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot___sharedTokensText_trgm_idx"
  ON "Slot" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Slot_History_id_idx"
  ON "Slot_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Slot_History_lastUpdated_idx"
  ON "Slot_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Slot_References_targetId_code_idx"
  ON "Slot_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Specimen_lastUpdated_idx"
  ON "Specimen" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Specimen_projectId_lastUpdated_idx"
  ON "Specimen" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Specimen_projectId_idx"
  ON "Specimen" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Specimen__source_idx"
  ON "Specimen" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Specimen_profile_idx"
  ON "Specimen" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Specimen___version_idx"
  ON "Specimen" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Specimen_reindex_idx"
  ON "Specimen" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Specimen_compartments_idx"
  ON "Specimen" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Specimen___accession_idx"
  ON "Specimen" USING gin ("__accession");

CREATE INDEX IF NOT EXISTS "Specimen___bodysite_idx"
  ON "Specimen" USING gin ("__bodysite");

CREATE INDEX IF NOT EXISTS "Specimen_collected_idx"
  ON "Specimen" USING btree ("collected");

CREATE INDEX IF NOT EXISTS "Specimen_collector_idx"
  ON "Specimen" USING btree ("collector");

CREATE INDEX IF NOT EXISTS "Specimen___container_idx"
  ON "Specimen" USING gin ("__container");

CREATE INDEX IF NOT EXISTS "Specimen___containerId_idx"
  ON "Specimen" USING gin ("__containerId");

CREATE INDEX IF NOT EXISTS "Specimen___identifier_idx"
  ON "Specimen" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Specimen_parent_idx"
  ON "Specimen" USING gin ("parent");

CREATE INDEX IF NOT EXISTS "Specimen_patient_idx"
  ON "Specimen" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Specimen___status_idx"
  ON "Specimen" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Specimen_subject_idx"
  ON "Specimen" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Specimen___type_idx"
  ON "Specimen" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Specimen___sharedTokens_idx"
  ON "Specimen" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Specimen___accessionText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__accessionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___bodysiteText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__bodysiteText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___containerText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__containerText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___containerIdText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__containerIdText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___identifierText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___statusText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___typeText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen____tagText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen___sharedTokensText_trgm_idx"
  ON "Specimen" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Specimen_History_id_idx"
  ON "Specimen_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Specimen_History_lastUpdated_idx"
  ON "Specimen_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Specimen_References_targetId_code_idx"
  ON "Specimen_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_lastUpdated_idx"
  ON "SpecimenDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_projectId_lastUpdated_idx"
  ON "SpecimenDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_projectId_idx"
  ON "SpecimenDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition__source_idx"
  ON "SpecimenDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_profile_idx"
  ON "SpecimenDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___version_idx"
  ON "SpecimenDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_reindex_idx"
  ON "SpecimenDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_compartments_idx"
  ON "SpecimenDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___container_idx"
  ON "SpecimenDefinition" USING gin ("__container");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___identifier_idx"
  ON "SpecimenDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___type_idx"
  ON "SpecimenDefinition" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___sharedTokens_idx"
  ON "SpecimenDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___containerText_trgm_idx"
  ON "SpecimenDefinition" USING gin (token_array_to_text("__containerText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___identifierText_trgm_idx"
  ON "SpecimenDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___typeText_trgm_idx"
  ON "SpecimenDefinition" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SpecimenDefinition____tagText_trgm_idx"
  ON "SpecimenDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SpecimenDefinition___sharedTokensText_trgm_idx"
  ON "SpecimenDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_History_id_idx"
  ON "SpecimenDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_History_lastUpdated_idx"
  ON "SpecimenDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SpecimenDefinition_References_targetId_code_idx"
  ON "SpecimenDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "StructureDefinition_lastUpdated_idx"
  ON "StructureDefinition" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureDefinition_projectId_lastUpdated_idx"
  ON "StructureDefinition" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureDefinition_projectId_idx"
  ON "StructureDefinition" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "StructureDefinition__source_idx"
  ON "StructureDefinition" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "StructureDefinition_profile_idx"
  ON "StructureDefinition" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "StructureDefinition___version_idx"
  ON "StructureDefinition" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "StructureDefinition_reindex_idx"
  ON "StructureDefinition" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "StructureDefinition_compartments_idx"
  ON "StructureDefinition" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "StructureDefinition___abstract_idx"
  ON "StructureDefinition" USING gin ("__abstract");

CREATE INDEX IF NOT EXISTS "StructureDefinition_base_idx"
  ON "StructureDefinition" USING btree ("base");

CREATE INDEX IF NOT EXISTS "StructureDefinition___basePath_idx"
  ON "StructureDefinition" USING gin ("__basePath");

CREATE INDEX IF NOT EXISTS "StructureDefinition___context_idx"
  ON "StructureDefinition" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "StructureDefinition_contextQuantity_idx"
  ON "StructureDefinition" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "StructureDefinition___contextType_idx"
  ON "StructureDefinition" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "StructureDefinition_date_idx"
  ON "StructureDefinition" USING btree ("date");

CREATE INDEX IF NOT EXISTS "StructureDefinition___derivation_idx"
  ON "StructureDefinition" USING gin ("__derivation");

CREATE INDEX IF NOT EXISTS "StructureDefinition_description_idx"
  ON "StructureDefinition" USING btree ("description");

CREATE INDEX IF NOT EXISTS "StructureDefinition___experimental_idx"
  ON "StructureDefinition" USING gin ("__experimental");

CREATE INDEX IF NOT EXISTS "StructureDefinition___extContext_idx"
  ON "StructureDefinition" USING gin ("__extContext");

CREATE INDEX IF NOT EXISTS "StructureDefinition___identifier_idx"
  ON "StructureDefinition" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "StructureDefinition___jurisdiction_idx"
  ON "StructureDefinition" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "StructureDefinition___keyword_idx"
  ON "StructureDefinition" USING gin ("__keyword");

CREATE INDEX IF NOT EXISTS "StructureDefinition___kind_idx"
  ON "StructureDefinition" USING gin ("__kind");

CREATE INDEX IF NOT EXISTS "StructureDefinition___nameSort_idx"
  ON "StructureDefinition" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "StructureDefinition___path_idx"
  ON "StructureDefinition" USING gin ("__path");

CREATE INDEX IF NOT EXISTS "StructureDefinition_publisher_idx"
  ON "StructureDefinition" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "StructureDefinition___status_idx"
  ON "StructureDefinition" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "StructureDefinition_title_idx"
  ON "StructureDefinition" USING btree ("title");

CREATE INDEX IF NOT EXISTS "StructureDefinition_type_idx"
  ON "StructureDefinition" USING btree ("type");

CREATE INDEX IF NOT EXISTS "StructureDefinition_url_idx"
  ON "StructureDefinition" USING btree ("url");

CREATE INDEX IF NOT EXISTS "StructureDefinition_valueset_idx"
  ON "StructureDefinition" USING gin ("valueset");

CREATE INDEX IF NOT EXISTS "StructureDefinition_version_idx"
  ON "StructureDefinition" USING btree ("version");

CREATE INDEX IF NOT EXISTS "StructureDefinition___sharedTokens_idx"
  ON "StructureDefinition" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "StructureDefinition___abstractText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__abstractText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___basePathText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__basePathText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___contextText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___contextTypeText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___derivationText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__derivationText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___experimentalText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__experimentalText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___extContextText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__extContextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___identifierText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___jurisdictionText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___keywordText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__keywordText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___kindText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__kindText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___pathText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__pathText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___statusText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition____tagText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition___sharedTokensText_trgm_idx"
  ON "StructureDefinition" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureDefinition_History_id_idx"
  ON "StructureDefinition_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "StructureDefinition_History_lastUpdated_idx"
  ON "StructureDefinition_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureDefinition_References_targetId_code_idx"
  ON "StructureDefinition_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "StructureMap_lastUpdated_idx"
  ON "StructureMap" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureMap_projectId_lastUpdated_idx"
  ON "StructureMap" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureMap_projectId_idx"
  ON "StructureMap" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "StructureMap__source_idx"
  ON "StructureMap" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "StructureMap_profile_idx"
  ON "StructureMap" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "StructureMap___version_idx"
  ON "StructureMap" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "StructureMap_reindex_idx"
  ON "StructureMap" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "StructureMap_compartments_idx"
  ON "StructureMap" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "StructureMap___context_idx"
  ON "StructureMap" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "StructureMap_contextQuantity_idx"
  ON "StructureMap" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "StructureMap___contextType_idx"
  ON "StructureMap" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "StructureMap_date_idx"
  ON "StructureMap" USING btree ("date");

CREATE INDEX IF NOT EXISTS "StructureMap_description_idx"
  ON "StructureMap" USING btree ("description");

CREATE INDEX IF NOT EXISTS "StructureMap___identifier_idx"
  ON "StructureMap" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "StructureMap___jurisdiction_idx"
  ON "StructureMap" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "StructureMap___nameSort_idx"
  ON "StructureMap" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "StructureMap_publisher_idx"
  ON "StructureMap" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "StructureMap___status_idx"
  ON "StructureMap" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "StructureMap_title_idx"
  ON "StructureMap" USING btree ("title");

CREATE INDEX IF NOT EXISTS "StructureMap_url_idx"
  ON "StructureMap" USING btree ("url");

CREATE INDEX IF NOT EXISTS "StructureMap_version_idx"
  ON "StructureMap" USING btree ("version");

CREATE INDEX IF NOT EXISTS "StructureMap___sharedTokens_idx"
  ON "StructureMap" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "StructureMap___contextText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap___contextTypeText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap___identifierText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap___jurisdictionText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap___statusText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap____tagText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap___sharedTokensText_trgm_idx"
  ON "StructureMap" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "StructureMap_History_id_idx"
  ON "StructureMap_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "StructureMap_History_lastUpdated_idx"
  ON "StructureMap_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "StructureMap_References_targetId_code_idx"
  ON "StructureMap_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Subscription_lastUpdated_idx"
  ON "Subscription" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Subscription_projectId_lastUpdated_idx"
  ON "Subscription" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Subscription_projectId_idx"
  ON "Subscription" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Subscription__source_idx"
  ON "Subscription" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Subscription_profile_idx"
  ON "Subscription" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Subscription___version_idx"
  ON "Subscription" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Subscription_reindex_idx"
  ON "Subscription" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Subscription_compartments_idx"
  ON "Subscription" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Subscription___contact_idx"
  ON "Subscription" USING gin ("__contact");

CREATE INDEX IF NOT EXISTS "Subscription_criteria_idx"
  ON "Subscription" USING btree ("criteria");

CREATE INDEX IF NOT EXISTS "Subscription___payload_idx"
  ON "Subscription" USING gin ("__payload");

CREATE INDEX IF NOT EXISTS "Subscription___status_idx"
  ON "Subscription" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Subscription___type_idx"
  ON "Subscription" USING gin ("__type");

CREATE INDEX IF NOT EXISTS "Subscription_url_idx"
  ON "Subscription" USING btree ("url");

CREATE INDEX IF NOT EXISTS "Subscription___sharedTokens_idx"
  ON "Subscription" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Subscription___contactText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("__contactText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription___payloadText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("__payloadText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription___statusText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription___typeText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("__typeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription____tagText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription___sharedTokensText_trgm_idx"
  ON "Subscription" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Subscription_History_id_idx"
  ON "Subscription_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Subscription_History_lastUpdated_idx"
  ON "Subscription_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Subscription_References_targetId_code_idx"
  ON "Subscription_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Substance_lastUpdated_idx"
  ON "Substance" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Substance_projectId_lastUpdated_idx"
  ON "Substance" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Substance_projectId_idx"
  ON "Substance" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Substance__source_idx"
  ON "Substance" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Substance_profile_idx"
  ON "Substance" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Substance___version_idx"
  ON "Substance" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Substance_reindex_idx"
  ON "Substance" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Substance_compartments_idx"
  ON "Substance" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Substance___category_idx"
  ON "Substance" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "Substance___code_idx"
  ON "Substance" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Substance___containerIdentifier_idx"
  ON "Substance" USING gin ("__containerIdentifier");

CREATE INDEX IF NOT EXISTS "Substance_expiry_idx"
  ON "Substance" USING gin ("expiry");

CREATE INDEX IF NOT EXISTS "Substance___identifier_idx"
  ON "Substance" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Substance_quantity_idx"
  ON "Substance" USING gin ("quantity");

CREATE INDEX IF NOT EXISTS "Substance___status_idx"
  ON "Substance" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Substance_substanceReference_idx"
  ON "Substance" USING gin ("substanceReference");

CREATE INDEX IF NOT EXISTS "Substance___sharedTokens_idx"
  ON "Substance" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Substance___categoryText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance___codeText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance___containerIdentifierText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__containerIdentifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance___identifierText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance___statusText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance____tagText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance___sharedTokensText_trgm_idx"
  ON "Substance" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Substance_History_id_idx"
  ON "Substance_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Substance_History_lastUpdated_idx"
  ON "Substance_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Substance_References_targetId_code_idx"
  ON "Substance_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_lastUpdated_idx"
  ON "SubstanceNucleicAcid" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_projectId_lastUpdated_idx"
  ON "SubstanceNucleicAcid" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_projectId_idx"
  ON "SubstanceNucleicAcid" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid__source_idx"
  ON "SubstanceNucleicAcid" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_profile_idx"
  ON "SubstanceNucleicAcid" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid___version_idx"
  ON "SubstanceNucleicAcid" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_reindex_idx"
  ON "SubstanceNucleicAcid" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_compartments_idx"
  ON "SubstanceNucleicAcid" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid___sharedTokens_idx"
  ON "SubstanceNucleicAcid" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid____tagText_trgm_idx"
  ON "SubstanceNucleicAcid" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid___sharedTokensText_trgm_idx"
  ON "SubstanceNucleicAcid" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_History_id_idx"
  ON "SubstanceNucleicAcid_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_History_lastUpdated_idx"
  ON "SubstanceNucleicAcid_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceNucleicAcid_References_targetId_code_idx"
  ON "SubstanceNucleicAcid_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_lastUpdated_idx"
  ON "SubstancePolymer" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_projectId_lastUpdated_idx"
  ON "SubstancePolymer" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_projectId_idx"
  ON "SubstancePolymer" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstancePolymer__source_idx"
  ON "SubstancePolymer" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_profile_idx"
  ON "SubstancePolymer" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstancePolymer___version_idx"
  ON "SubstancePolymer" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_reindex_idx"
  ON "SubstancePolymer" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstancePolymer_compartments_idx"
  ON "SubstancePolymer" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstancePolymer___sharedTokens_idx"
  ON "SubstancePolymer" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstancePolymer____tagText_trgm_idx"
  ON "SubstancePolymer" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstancePolymer___sharedTokensText_trgm_idx"
  ON "SubstancePolymer" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstancePolymer_History_id_idx"
  ON "SubstancePolymer_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_History_lastUpdated_idx"
  ON "SubstancePolymer_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstancePolymer_References_targetId_code_idx"
  ON "SubstancePolymer_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_lastUpdated_idx"
  ON "SubstanceProtein" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_projectId_lastUpdated_idx"
  ON "SubstanceProtein" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_projectId_idx"
  ON "SubstanceProtein" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstanceProtein__source_idx"
  ON "SubstanceProtein" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_profile_idx"
  ON "SubstanceProtein" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstanceProtein___version_idx"
  ON "SubstanceProtein" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_reindex_idx"
  ON "SubstanceProtein" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstanceProtein_compartments_idx"
  ON "SubstanceProtein" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstanceProtein___sharedTokens_idx"
  ON "SubstanceProtein" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstanceProtein____tagText_trgm_idx"
  ON "SubstanceProtein" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceProtein___sharedTokensText_trgm_idx"
  ON "SubstanceProtein" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceProtein_History_id_idx"
  ON "SubstanceProtein_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_History_lastUpdated_idx"
  ON "SubstanceProtein_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceProtein_References_targetId_code_idx"
  ON "SubstanceProtein_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_lastUpdated_idx"
  ON "SubstanceReferenceInformation" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_projectId_lastUpdated_idx"
  ON "SubstanceReferenceInformation" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_projectId_idx"
  ON "SubstanceReferenceInformation" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation__source_idx"
  ON "SubstanceReferenceInformation" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_profile_idx"
  ON "SubstanceReferenceInformation" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation___version_idx"
  ON "SubstanceReferenceInformation" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_reindex_idx"
  ON "SubstanceReferenceInformation" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_compartments_idx"
  ON "SubstanceReferenceInformation" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation___sharedTokens_idx"
  ON "SubstanceReferenceInformation" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation____tagText_trgm_idx"
  ON "SubstanceReferenceInformation" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation___sharedTokensText_trgm_idx"
  ON "SubstanceReferenceInformation" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_History_id_idx"
  ON "SubstanceReferenceInformation_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_History_lastUpdated_idx"
  ON "SubstanceReferenceInformation_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceReferenceInformation_References_targetId_code_idx"
  ON "SubstanceReferenceInformation_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_lastUpdated_idx"
  ON "SubstanceSourceMaterial" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_projectId_lastUpdated_idx"
  ON "SubstanceSourceMaterial" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_projectId_idx"
  ON "SubstanceSourceMaterial" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial__source_idx"
  ON "SubstanceSourceMaterial" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_profile_idx"
  ON "SubstanceSourceMaterial" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial___version_idx"
  ON "SubstanceSourceMaterial" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_reindex_idx"
  ON "SubstanceSourceMaterial" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_compartments_idx"
  ON "SubstanceSourceMaterial" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial___sharedTokens_idx"
  ON "SubstanceSourceMaterial" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial____tagText_trgm_idx"
  ON "SubstanceSourceMaterial" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial___sharedTokensText_trgm_idx"
  ON "SubstanceSourceMaterial" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_History_id_idx"
  ON "SubstanceSourceMaterial_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_History_lastUpdated_idx"
  ON "SubstanceSourceMaterial_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSourceMaterial_References_targetId_code_idx"
  ON "SubstanceSourceMaterial_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_lastUpdated_idx"
  ON "SubstanceSpecification" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_projectId_lastUpdated_idx"
  ON "SubstanceSpecification" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_projectId_idx"
  ON "SubstanceSpecification" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification__source_idx"
  ON "SubstanceSpecification" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_profile_idx"
  ON "SubstanceSpecification" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification___version_idx"
  ON "SubstanceSpecification" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_reindex_idx"
  ON "SubstanceSpecification" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_compartments_idx"
  ON "SubstanceSpecification" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification___code_idx"
  ON "SubstanceSpecification" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification___sharedTokens_idx"
  ON "SubstanceSpecification" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification___codeText_trgm_idx"
  ON "SubstanceSpecification" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceSpecification____tagText_trgm_idx"
  ON "SubstanceSpecification" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceSpecification___sharedTokensText_trgm_idx"
  ON "SubstanceSpecification" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_History_id_idx"
  ON "SubstanceSpecification_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_History_lastUpdated_idx"
  ON "SubstanceSpecification_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SubstanceSpecification_References_targetId_code_idx"
  ON "SubstanceSpecification_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_lastUpdated_idx"
  ON "SupplyDelivery" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_projectId_lastUpdated_idx"
  ON "SupplyDelivery" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_projectId_idx"
  ON "SupplyDelivery" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SupplyDelivery__source_idx"
  ON "SupplyDelivery" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_profile_idx"
  ON "SupplyDelivery" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SupplyDelivery___version_idx"
  ON "SupplyDelivery" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_reindex_idx"
  ON "SupplyDelivery" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SupplyDelivery_compartments_idx"
  ON "SupplyDelivery" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SupplyDelivery___identifier_idx"
  ON "SupplyDelivery" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_patient_idx"
  ON "SupplyDelivery" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_receiver_idx"
  ON "SupplyDelivery" USING gin ("receiver");

CREATE INDEX IF NOT EXISTS "SupplyDelivery___status_idx"
  ON "SupplyDelivery" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_supplier_idx"
  ON "SupplyDelivery" USING btree ("supplier");

CREATE INDEX IF NOT EXISTS "SupplyDelivery___sharedTokens_idx"
  ON "SupplyDelivery" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SupplyDelivery___identifierText_trgm_idx"
  ON "SupplyDelivery" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyDelivery___statusText_trgm_idx"
  ON "SupplyDelivery" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyDelivery____tagText_trgm_idx"
  ON "SupplyDelivery" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyDelivery___sharedTokensText_trgm_idx"
  ON "SupplyDelivery" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyDelivery_History_id_idx"
  ON "SupplyDelivery_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_History_lastUpdated_idx"
  ON "SupplyDelivery_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyDelivery_References_targetId_code_idx"
  ON "SupplyDelivery_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "SupplyRequest_lastUpdated_idx"
  ON "SupplyRequest" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyRequest_projectId_lastUpdated_idx"
  ON "SupplyRequest" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyRequest_projectId_idx"
  ON "SupplyRequest" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "SupplyRequest__source_idx"
  ON "SupplyRequest" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "SupplyRequest_profile_idx"
  ON "SupplyRequest" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "SupplyRequest___version_idx"
  ON "SupplyRequest" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "SupplyRequest_reindex_idx"
  ON "SupplyRequest" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "SupplyRequest_compartments_idx"
  ON "SupplyRequest" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "SupplyRequest___category_idx"
  ON "SupplyRequest" USING gin ("__category");

CREATE INDEX IF NOT EXISTS "SupplyRequest_date_idx"
  ON "SupplyRequest" USING btree ("date");

CREATE INDEX IF NOT EXISTS "SupplyRequest___identifier_idx"
  ON "SupplyRequest" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "SupplyRequest_requester_idx"
  ON "SupplyRequest" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "SupplyRequest___status_idx"
  ON "SupplyRequest" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "SupplyRequest_subject_idx"
  ON "SupplyRequest" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "SupplyRequest_supplier_idx"
  ON "SupplyRequest" USING gin ("supplier");

CREATE INDEX IF NOT EXISTS "SupplyRequest___sharedTokens_idx"
  ON "SupplyRequest" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "SupplyRequest___categoryText_trgm_idx"
  ON "SupplyRequest" USING gin (token_array_to_text("__categoryText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyRequest___identifierText_trgm_idx"
  ON "SupplyRequest" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyRequest___statusText_trgm_idx"
  ON "SupplyRequest" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyRequest____tagText_trgm_idx"
  ON "SupplyRequest" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyRequest___sharedTokensText_trgm_idx"
  ON "SupplyRequest" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "SupplyRequest_History_id_idx"
  ON "SupplyRequest_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "SupplyRequest_History_lastUpdated_idx"
  ON "SupplyRequest_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "SupplyRequest_References_targetId_code_idx"
  ON "SupplyRequest_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "Task_lastUpdated_idx"
  ON "Task" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Task_projectId_lastUpdated_idx"
  ON "Task" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "Task_projectId_idx"
  ON "Task" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "Task__source_idx"
  ON "Task" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "Task_profile_idx"
  ON "Task" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "Task___version_idx"
  ON "Task" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "Task_reindex_idx"
  ON "Task" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "Task_compartments_idx"
  ON "Task" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "Task_authoredOn_idx"
  ON "Task" USING btree ("authoredOn");

CREATE INDEX IF NOT EXISTS "Task_basedOn_idx"
  ON "Task" USING gin ("basedOn");

CREATE INDEX IF NOT EXISTS "Task___businessStatus_idx"
  ON "Task" USING gin ("__businessStatus");

CREATE INDEX IF NOT EXISTS "Task___code_idx"
  ON "Task" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "Task_encounter_idx"
  ON "Task" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "Task_focus_idx"
  ON "Task" USING btree ("focus");

CREATE INDEX IF NOT EXISTS "Task___groupIdentifier_idx"
  ON "Task" USING gin ("__groupIdentifier");

CREATE INDEX IF NOT EXISTS "Task___identifier_idx"
  ON "Task" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "Task___intent_idx"
  ON "Task" USING gin ("__intent");

CREATE INDEX IF NOT EXISTS "Task_modified_idx"
  ON "Task" USING btree ("modified");

CREATE INDEX IF NOT EXISTS "Task_owner_idx"
  ON "Task" USING btree ("owner");

CREATE INDEX IF NOT EXISTS "Task_partOf_idx"
  ON "Task" USING gin ("partOf");

CREATE INDEX IF NOT EXISTS "Task_patient_idx"
  ON "Task" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "Task___performer_idx"
  ON "Task" USING gin ("__performer");

CREATE INDEX IF NOT EXISTS "Task_period_idx"
  ON "Task" USING btree ("period");

CREATE INDEX IF NOT EXISTS "Task___priority_idx"
  ON "Task" USING gin ("__priority");

CREATE INDEX IF NOT EXISTS "Task_requester_idx"
  ON "Task" USING btree ("requester");

CREATE INDEX IF NOT EXISTS "Task___status_idx"
  ON "Task" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "Task_subject_idx"
  ON "Task" USING btree ("subject");

CREATE INDEX IF NOT EXISTS "Task___sharedTokens_idx"
  ON "Task" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "Task___businessStatusText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__businessStatusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___codeText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___groupIdentifierText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__groupIdentifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___identifierText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___intentText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__intentText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___performerText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__performerText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___priorityText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__priorityText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___statusText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task____tagText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task___sharedTokensText_trgm_idx"
  ON "Task" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Task_History_id_idx"
  ON "Task_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "Task_History_lastUpdated_idx"
  ON "Task_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "Task_References_targetId_code_idx"
  ON "Task_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_lastUpdated_idx"
  ON "TerminologyCapabilities" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_projectId_lastUpdated_idx"
  ON "TerminologyCapabilities" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_projectId_idx"
  ON "TerminologyCapabilities" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities__source_idx"
  ON "TerminologyCapabilities" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_profile_idx"
  ON "TerminologyCapabilities" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___version_idx"
  ON "TerminologyCapabilities" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_reindex_idx"
  ON "TerminologyCapabilities" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_compartments_idx"
  ON "TerminologyCapabilities" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___context_idx"
  ON "TerminologyCapabilities" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_contextQuantity_idx"
  ON "TerminologyCapabilities" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___contextType_idx"
  ON "TerminologyCapabilities" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_date_idx"
  ON "TerminologyCapabilities" USING btree ("date");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_description_idx"
  ON "TerminologyCapabilities" USING btree ("description");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___jurisdiction_idx"
  ON "TerminologyCapabilities" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___nameSort_idx"
  ON "TerminologyCapabilities" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_publisher_idx"
  ON "TerminologyCapabilities" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___status_idx"
  ON "TerminologyCapabilities" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_title_idx"
  ON "TerminologyCapabilities" USING btree ("title");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_url_idx"
  ON "TerminologyCapabilities" USING btree ("url");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_version_idx"
  ON "TerminologyCapabilities" USING btree ("version");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___sharedTokens_idx"
  ON "TerminologyCapabilities" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___contextText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___contextTypeText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___jurisdictionText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___statusText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities____tagText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities___sharedTokensText_trgm_idx"
  ON "TerminologyCapabilities" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_History_id_idx"
  ON "TerminologyCapabilities_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_History_lastUpdated_idx"
  ON "TerminologyCapabilities_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TerminologyCapabilities_References_targetId_code_idx"
  ON "TerminologyCapabilities_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "TestReport_lastUpdated_idx"
  ON "TestReport" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TestReport_projectId_lastUpdated_idx"
  ON "TestReport" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "TestReport_projectId_idx"
  ON "TestReport" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "TestReport__source_idx"
  ON "TestReport" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "TestReport_profile_idx"
  ON "TestReport" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "TestReport___version_idx"
  ON "TestReport" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "TestReport_reindex_idx"
  ON "TestReport" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "TestReport_compartments_idx"
  ON "TestReport" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "TestReport___identifier_idx"
  ON "TestReport" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "TestReport_issued_idx"
  ON "TestReport" USING btree ("issued");

CREATE INDEX IF NOT EXISTS "TestReport_participant_idx"
  ON "TestReport" USING gin ("participant");

CREATE INDEX IF NOT EXISTS "TestReport___result_idx"
  ON "TestReport" USING gin ("__result");

CREATE INDEX IF NOT EXISTS "TestReport_tester_idx"
  ON "TestReport" USING btree ("tester");

CREATE INDEX IF NOT EXISTS "TestReport_testscript_idx"
  ON "TestReport" USING btree ("testscript");

CREATE INDEX IF NOT EXISTS "TestReport___sharedTokens_idx"
  ON "TestReport" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "TestReport___identifierText_trgm_idx"
  ON "TestReport" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestReport___resultText_trgm_idx"
  ON "TestReport" USING gin (token_array_to_text("__resultText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestReport____tagText_trgm_idx"
  ON "TestReport" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestReport___sharedTokensText_trgm_idx"
  ON "TestReport" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestReport_History_id_idx"
  ON "TestReport_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "TestReport_History_lastUpdated_idx"
  ON "TestReport_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TestReport_References_targetId_code_idx"
  ON "TestReport_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "TestScript_lastUpdated_idx"
  ON "TestScript" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TestScript_projectId_lastUpdated_idx"
  ON "TestScript" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "TestScript_projectId_idx"
  ON "TestScript" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "TestScript__source_idx"
  ON "TestScript" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "TestScript_profile_idx"
  ON "TestScript" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "TestScript___version_idx"
  ON "TestScript" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "TestScript_reindex_idx"
  ON "TestScript" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "TestScript_compartments_idx"
  ON "TestScript" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "TestScript___context_idx"
  ON "TestScript" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "TestScript_contextQuantity_idx"
  ON "TestScript" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "TestScript___contextType_idx"
  ON "TestScript" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "TestScript_date_idx"
  ON "TestScript" USING btree ("date");

CREATE INDEX IF NOT EXISTS "TestScript_description_idx"
  ON "TestScript" USING btree ("description");

CREATE INDEX IF NOT EXISTS "TestScript___identifier_idx"
  ON "TestScript" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "TestScript___jurisdiction_idx"
  ON "TestScript" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "TestScript___nameSort_idx"
  ON "TestScript" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "TestScript_publisher_idx"
  ON "TestScript" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "TestScript___status_idx"
  ON "TestScript" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "TestScript_testscriptCapability_idx"
  ON "TestScript" USING gin ("testscriptCapability");

CREATE INDEX IF NOT EXISTS "TestScript_title_idx"
  ON "TestScript" USING btree ("title");

CREATE INDEX IF NOT EXISTS "TestScript_url_idx"
  ON "TestScript" USING btree ("url");

CREATE INDEX IF NOT EXISTS "TestScript_version_idx"
  ON "TestScript" USING btree ("version");

CREATE INDEX IF NOT EXISTS "TestScript___sharedTokens_idx"
  ON "TestScript" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "TestScript___contextText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript___contextTypeText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript___identifierText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript___jurisdictionText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript___statusText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript____tagText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript___sharedTokensText_trgm_idx"
  ON "TestScript" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "TestScript_History_id_idx"
  ON "TestScript_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "TestScript_History_lastUpdated_idx"
  ON "TestScript_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "TestScript_References_targetId_code_idx"
  ON "TestScript_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "ValueSet_lastUpdated_idx"
  ON "ValueSet" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ValueSet_projectId_lastUpdated_idx"
  ON "ValueSet" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "ValueSet_projectId_idx"
  ON "ValueSet" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "ValueSet__source_idx"
  ON "ValueSet" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "ValueSet_profile_idx"
  ON "ValueSet" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "ValueSet___version_idx"
  ON "ValueSet" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "ValueSet_reindex_idx"
  ON "ValueSet" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "ValueSet_compartments_idx"
  ON "ValueSet" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "ValueSet___code_idx"
  ON "ValueSet" USING gin ("__code");

CREATE INDEX IF NOT EXISTS "ValueSet___context_idx"
  ON "ValueSet" USING gin ("__context");

CREATE INDEX IF NOT EXISTS "ValueSet_contextQuantity_idx"
  ON "ValueSet" USING gin ("contextQuantity");

CREATE INDEX IF NOT EXISTS "ValueSet___contextType_idx"
  ON "ValueSet" USING gin ("__contextType");

CREATE INDEX IF NOT EXISTS "ValueSet_date_idx"
  ON "ValueSet" USING btree ("date");

CREATE INDEX IF NOT EXISTS "ValueSet_description_idx"
  ON "ValueSet" USING btree ("description");

CREATE INDEX IF NOT EXISTS "ValueSet_expansion_idx"
  ON "ValueSet" USING btree ("expansion");

CREATE INDEX IF NOT EXISTS "ValueSet___identifier_idx"
  ON "ValueSet" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "ValueSet___jurisdiction_idx"
  ON "ValueSet" USING gin ("__jurisdiction");

CREATE INDEX IF NOT EXISTS "ValueSet___nameSort_idx"
  ON "ValueSet" USING btree ("__nameSort");

CREATE INDEX IF NOT EXISTS "ValueSet_publisher_idx"
  ON "ValueSet" USING btree ("publisher");

CREATE INDEX IF NOT EXISTS "ValueSet_reference_idx"
  ON "ValueSet" USING gin ("reference");

CREATE INDEX IF NOT EXISTS "ValueSet___status_idx"
  ON "ValueSet" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "ValueSet_title_idx"
  ON "ValueSet" USING btree ("title");

CREATE INDEX IF NOT EXISTS "ValueSet_url_idx"
  ON "ValueSet" USING btree ("url");

CREATE INDEX IF NOT EXISTS "ValueSet_version_idx"
  ON "ValueSet" USING btree ("version");

CREATE INDEX IF NOT EXISTS "ValueSet___sharedTokens_idx"
  ON "ValueSet" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "ValueSet___codeText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__codeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___contextText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__contextText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___contextTypeText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__contextTypeText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___identifierText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___jurisdictionText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__jurisdictionText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___statusText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet____tagText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet___sharedTokensText_trgm_idx"
  ON "ValueSet" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ValueSet_History_id_idx"
  ON "ValueSet_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "ValueSet_History_lastUpdated_idx"
  ON "ValueSet_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "ValueSet_References_targetId_code_idx"
  ON "ValueSet_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "VerificationResult_lastUpdated_idx"
  ON "VerificationResult" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "VerificationResult_projectId_lastUpdated_idx"
  ON "VerificationResult" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "VerificationResult_projectId_idx"
  ON "VerificationResult" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "VerificationResult__source_idx"
  ON "VerificationResult" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "VerificationResult_profile_idx"
  ON "VerificationResult" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "VerificationResult___version_idx"
  ON "VerificationResult" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "VerificationResult_reindex_idx"
  ON "VerificationResult" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "VerificationResult_compartments_idx"
  ON "VerificationResult" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "VerificationResult_target_idx"
  ON "VerificationResult" USING gin ("target");

CREATE INDEX IF NOT EXISTS "VerificationResult___sharedTokens_idx"
  ON "VerificationResult" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "VerificationResult____tagText_trgm_idx"
  ON "VerificationResult" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VerificationResult___sharedTokensText_trgm_idx"
  ON "VerificationResult" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VerificationResult_History_id_idx"
  ON "VerificationResult_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "VerificationResult_History_lastUpdated_idx"
  ON "VerificationResult_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "VerificationResult_References_targetId_code_idx"
  ON "VerificationResult_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

CREATE INDEX IF NOT EXISTS "VisionPrescription_lastUpdated_idx"
  ON "VisionPrescription" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "VisionPrescription_projectId_lastUpdated_idx"
  ON "VisionPrescription" USING btree ("projectId", "lastUpdated");

CREATE INDEX IF NOT EXISTS "VisionPrescription_projectId_idx"
  ON "VisionPrescription" USING btree ("projectId");

CREATE INDEX IF NOT EXISTS "VisionPrescription__source_idx"
  ON "VisionPrescription" USING btree ("_source");

CREATE INDEX IF NOT EXISTS "VisionPrescription_profile_idx"
  ON "VisionPrescription" USING gin ("_profile");

CREATE INDEX IF NOT EXISTS "VisionPrescription___version_idx"
  ON "VisionPrescription" USING btree ("__version");

CREATE INDEX IF NOT EXISTS "VisionPrescription_reindex_idx"
  ON "VisionPrescription" USING btree ("lastUpdated", "__version")
  WHERE deleted = false;

CREATE INDEX IF NOT EXISTS "VisionPrescription_compartments_idx"
  ON "VisionPrescription" USING gin ("compartments");

CREATE INDEX IF NOT EXISTS "VisionPrescription_datewritten_idx"
  ON "VisionPrescription" USING btree ("datewritten");

CREATE INDEX IF NOT EXISTS "VisionPrescription_encounter_idx"
  ON "VisionPrescription" USING btree ("encounter");

CREATE INDEX IF NOT EXISTS "VisionPrescription___identifier_idx"
  ON "VisionPrescription" USING gin ("__identifier");

CREATE INDEX IF NOT EXISTS "VisionPrescription_patient_idx"
  ON "VisionPrescription" USING btree ("patient");

CREATE INDEX IF NOT EXISTS "VisionPrescription_prescriber_idx"
  ON "VisionPrescription" USING btree ("prescriber");

CREATE INDEX IF NOT EXISTS "VisionPrescription___status_idx"
  ON "VisionPrescription" USING gin ("__status");

CREATE INDEX IF NOT EXISTS "VisionPrescription___sharedTokens_idx"
  ON "VisionPrescription" USING gin ("__sharedTokens");

CREATE INDEX IF NOT EXISTS "VisionPrescription___identifierText_trgm_idx"
  ON "VisionPrescription" USING gin (token_array_to_text("__identifierText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VisionPrescription___statusText_trgm_idx"
  ON "VisionPrescription" USING gin (token_array_to_text("__statusText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VisionPrescription____tagText_trgm_idx"
  ON "VisionPrescription" USING gin (token_array_to_text("___tagText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VisionPrescription___sharedTokensText_trgm_idx"
  ON "VisionPrescription" USING gin (token_array_to_text("__sharedTokensText") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "VisionPrescription_History_id_idx"
  ON "VisionPrescription_History" USING btree ("id");

CREATE INDEX IF NOT EXISTS "VisionPrescription_History_lastUpdated_idx"
  ON "VisionPrescription_History" USING btree ("lastUpdated");

CREATE INDEX IF NOT EXISTS "VisionPrescription_References_targetId_code_idx"
  ON "VisionPrescription_References" USING btree ("targetId", "code")
  INCLUDE ("resourceId");

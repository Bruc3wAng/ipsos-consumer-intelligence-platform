import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const researchProjects = sqliteTable("research_projects", {
  id: text("id").primaryKey(),
  clientScope: text("client_scope").notNull(),
  title: text("title").notNull(),
  market: text("market").notNull(),
  methodology: text("methodology").notNull(),
  sampleSize: integer("sample_size").notNull(),
  fieldworkEnd: text("fieldwork_end").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const surveyWaves = sqliteTable(
  "survey_waves",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull().references(() => researchProjects.id),
    market: text("market").notNull(),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    grain: text("grain").notNull().default("respondent_wave"),
    respondentCount: integer("respondent_count").notNull(),
    ingestionStatus: text("ingestion_status").notNull().default("validated"),
    loadedAt: text("loaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_survey_waves_market_period").on(table.market, table.periodEnd)],
);

export const metricObservations = sqliteTable(
  "metric_observations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    waveId: text("wave_id").notNull().references(() => surveyWaves.id),
    metricKey: text("metric_key").notNull(),
    segmentKey: text("segment_key").notNull().default("total"),
    market: text("market").notNull(),
    value: real("value").notNull(),
    denominator: integer("denominator").notNull(),
    observedAt: text("observed_at").notNull(),
  },
  (table) => [
    index("idx_metric_observations_lookup").on(table.metricKey, table.market, table.observedAt),
    uniqueIndex("uq_metric_wave_segment").on(table.waveId, table.metricKey, table.segmentKey),
  ],
);

export const modelRegistry = sqliteTable("model_registry", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  family: text("family").notNull(),
  targetDefinition: text("target_definition").notNull(),
  version: text("version").notNull(),
  validationMethod: text("validation_method").notNull(),
  status: text("status").notNull(),
  trainedThrough: text("trained_through"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const modelRuns = sqliteTable(
  "model_runs",
  {
    id: text("id").primaryKey(),
    modelId: text("model_id").notNull().references(() => modelRegistry.id),
    waveId: text("wave_id").references(() => surveyWaves.id),
    market: text("market").notNull(),
    predictionHorizon: text("prediction_horizon").notNull(),
    prediction: real("prediction").notNull(),
    lowerBound: real("lower_bound"),
    upperBound: real("upper_bound"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_model_runs_model_market").on(table.modelId, table.market, table.createdAt)],
);

export const outcomeLabels = sqliteTable(
  "outcome_labels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientScope: text("client_scope").notNull(),
    entityKey: text("entity_key").notNull(),
    market: text("market").notNull(),
    outcomeKey: text("outcome_key").notNull(),
    outcomeValue: real("outcome_value").notNull(),
    observedAt: text("observed_at").notNull(),
    sourceSystem: text("source_system").notNull(),
  },
  (table) => [index("idx_outcome_labels_entity_market").on(table.entityKey, table.market, table.observedAt)],
);

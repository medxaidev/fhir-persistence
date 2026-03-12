--
-- PostgreSQL database dump
--

\restrict uxAl0HJJx5V4gDVDmR6GTDSARQDBE2ejqEz3fiT6piAu04efy2fePuVlJmMGHsp

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-24 16:21:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 221827)
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id uuid NOT NULL,
    content text NOT NULL,
    "lastUpdated" timestamp with time zone NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    "projectId" uuid NOT NULL,
    __version integer NOT NULL,
    _source text,
    _profile text[],
    __tag uuid[],
    "__tagText" text[],
    "__tagSort" text,
    __security uuid[],
    "__securityText" text[],
    "__securitySort" text,
    compartments uuid[] NOT NULL,
    __identifier uuid[],
    "__identifierText" text[],
    "__identifierSort" text,
    "__nameSort" text,
    owner text,
    patient text[],
    period timestamp with time zone,
    __status uuid[],
    "__statusText" text[],
    "__statusSort" text,
    subject text[],
    __type uuid[],
    "__typeText" text[],
    "__typeSort" text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- TOC entry 6063 (class 2606 OID 221834)
-- Name: Account Account_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pk" PRIMARY KEY (id);


--
-- TOC entry 6052 (class 1259 OID 225047)
-- Name: Account___identifier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___identifier_idx" ON public."Account" USING gin (__identifier);


--
-- TOC entry 6053 (class 1259 OID 225048)
-- Name: Account___nameSort_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___nameSort_idx" ON public."Account" USING btree ("__nameSort");


--
-- TOC entry 6054 (class 1259 OID 225052)
-- Name: Account___status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___status_idx" ON public."Account" USING gin (__status);


--
-- TOC entry 6055 (class 1259 OID 225054)
-- Name: Account___type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___type_idx" ON public."Account" USING gin (__type);


--
-- TOC entry 6056 (class 1259 OID 225042)
-- Name: Account__source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account__source_idx" ON public."Account" USING btree (_source);


--
-- TOC entry 6057 (class 1259 OID 225046)
-- Name: Account_compartments_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_compartments_idx" ON public."Account" USING gin (compartments);


--
-- TOC entry 6058 (class 1259 OID 225039)
-- Name: Account_lastUpdated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_lastUpdated_idx" ON public."Account" USING btree ("lastUpdated");


--
-- TOC entry 6059 (class 1259 OID 225049)
-- Name: Account_owner_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_owner_idx" ON public."Account" USING btree (owner);


--
-- TOC entry 6060 (class 1259 OID 225050)
-- Name: Account_patient_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_patient_idx" ON public."Account" USING gin (patient);


--
-- TOC entry 6061 (class 1259 OID 225051)
-- Name: Account_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_period_idx" ON public."Account" USING btree (period);


--
-- TOC entry 6064 (class 1259 OID 225043)
-- Name: Account_profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_profile_idx" ON public."Account" USING gin (_profile);


--
-- TOC entry 6065 (class 1259 OID 225041)
-- Name: Account_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_projectId_idx" ON public."Account" USING btree ("projectId");


--
-- TOC entry 6066 (class 1259 OID 225040)
-- Name: Account_projectId_lastUpdated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_projectId_lastUpdated_idx" ON public."Account" USING btree ("projectId", "lastUpdated");


--
-- TOC entry 6067 (class 1259 OID 225045)
-- Name: Account_reindex_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_reindex_idx" ON public."Account" USING btree ("lastUpdated", __version) WHERE (deleted = false);


--
-- TOC entry 6068 (class 1259 OID 225053)
-- Name: Account_subject_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_subject_idx" ON public."Account" USING gin (subject);


--
-- TOC entry 6069 (class 1259 OID 225044)
-- Name: Account_version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_version_idx" ON public."Account" USING btree (__version);


-- Completed on 2026-02-24 16:22:00

--
-- PostgreSQL database dump complete
--

\unrestrict uxAl0HJJx5V4gDVDmR6GTDSARQDBE2ejqEz3fiT6piAu04efy2fePuVlJmMGHsp

